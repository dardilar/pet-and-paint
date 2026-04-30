import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  SIZES,
  getProducts,
  getMinPrice,
  formatPrice,
  type Product,
  type ProductType,
  type Size,
} from '../data/products';
import { translations, type Lang } from '../i18n/translations';

function useLang(): Lang {
  const [lang, setLang] = useState<Lang>(() =>
    ((typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'es') as Lang
  );
  useEffect(() => {
    const handler = (e: Event) => {
      setLang((e as CustomEvent<{ lang: Lang }>).detail.lang);
    };
    document.addEventListener('languagechange', handler);
    return () => document.removeEventListener('languagechange', handler);
  }, []);
  return lang;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMISSION_TIMEOUT = 60_000;
const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY;

const CLOUDINARY_CLOUD = import.meta.env.PUBLIC_CLOUDINARY_CLOUD;
const CLOUDINARY_PRESET = import.meta.env.PUBLIC_CLOUDINARY_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

async function uploadPhoto(file: File, signal: AbortSignal, fallbackError: string): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);
  data.append('folder', 'pet-and-paint-orders');

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data, signal });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || fallbackError);
  }
  return json.secure_url;
}

function getProductTypeMeta(t: typeof translations[Lang]['form']): Record<ProductType, { label: string; emoji: string }> {
  return {
    hoodie: { label: t.productHoodie, emoji: '🧥' },
    'paint-kit': { label: t.productPaintKit, emoji: '🎨' },
  };
}

const PRODUCT_DESIGN_EMOJI: Record<string, string> = {
  'hoodie-face': '🐶',
  'hoodie-fingerprint': '🐾',
  'hoodie-both': '✨',
  'kit-numbers': '🎨',
  'kit-canvas': '🖼️',
};

function getDesignLabel(id: string, t: typeof translations[Lang]['form']): string {
  const map: Record<string, string> = {
    'hoodie-face': t.hoodieDesignFace,
    'hoodie-fingerprint': t.hoodieDesignFingerprint,
    'hoodie-both': t.hoodieDesignBoth,
    'kit-numbers': t.kitDesignNumbers,
    'kit-canvas': t.kitDesignCanvas,
  };
  return map[id] ?? id;
}

function getPhotoStepTitle(productId: string | undefined, t: typeof translations[Lang]['form']): string {
  if (productId === 'hoodie-fingerprint') return t.photoStepTitleFingerprint;
  if (productId === 'hoodie-both') return t.photoStepTitleBoth;
  return t.step1Title;
}

function getPhotoStepHint(productId: string | undefined, t: typeof translations[Lang]['form']): string {
  if (productId === 'hoodie-fingerprint') return t.photoHintFingerprint;
  return t.step1Hint;
}

const primaryBtn =
  'bg-brand-brown text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand-orange transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const backBtn = 'text-brand-brown hover:text-brand-orange transition-colors font-medium';
const inputClass =
  'w-full px-4 py-2.5 rounded-xl border-2 border-brand-tan focus:border-brand-orange focus:outline-none transition-colors bg-white';

function selectionClass(isSelected: boolean) {
  return isSelected
    ? 'border-brand-orange ring-2 ring-brand-orange bg-brand-orange/5'
    : 'border-brand-tan hover:border-brand-brown/40';
}

function validateFile(file: File, t: typeof translations[Lang]['form']): string | null {
  if (file.size > MAX_FILE_SIZE) return t.errorFileSize;
  if (!ACCEPTED_TYPES.includes(file.type)) return t.errorFileType;
  return null;
}

function generateOrderRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PP-${id}`;
}

// --- Sub-components ---

function StepIndicator({ current, labels }: { current: number; labels: [string, string, string] }) {
  return (
    <ol className="flex items-center justify-center gap-2 mb-8" aria-label="Order progress">
      {labels.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        return (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-0.5 ${isCompleted ? 'bg-brand-brown' : 'bg-brand-tan'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={isActive ? 'step' : undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-orange text-white'
                    : isCompleted
                      ? 'bg-brand-brown text-white'
                      : 'bg-brand-tan text-brand-brown'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className="text-xs text-brand-brown/70 hidden sm:block">{label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ErrorMessage({ message, id }: { message: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
      {message}
    </p>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-brown mb-1">
        {label} {required && '*'}
      </label>
      {children}
    </div>
  );
}

function UploadZone({
  label,
  preview,
  fileName,
  error,
  dragActive,
  inputRef,
  ariaLabel,
  hint,
  onFileChange,
  onDrop,
  onDragEnter,
  onDragLeave,
  t,
}: {
  label?: string;
  preview: string | null;
  fileName?: string;
  error: string;
  dragActive: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  ariaLabel: string;
  hint: string;
  onFileChange: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  t: typeof translations[Lang]['form'];
}) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-semibold text-brand-brown">{label}</p>
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[200px] ${
          dragActive
            ? 'border-brand-orange bg-brand-orange/5'
            : preview
              ? 'border-brand-brown/30 bg-brand-cream/50'
              : 'border-brand-brown/25 bg-brand-cream hover:border-brand-orange'
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
          }}
        />
        {preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            <p className="text-xs text-brand-brown/70">{fileName} — {t.step1ReplaceHint}</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            <svg className="w-10 h-10 mx-auto text-brand-brown/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-brand-brown font-medium text-sm">{t.step1UploadCta}</p>
            <p className="text-xs text-brand-brown/50">{hint}</p>
          </div>
        )}
      </div>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

// --- Main component ---

export default function OrderForm() {
  const lang = useLang();
  const t = translations[lang].form;
  const productTypeMeta = useMemo(() => getProductTypeMeta(t), [t]);

  const [step, setStep] = useState(1);

  // Product selection
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  // Primary photo (pet face / pet photo)
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Secondary photo (fingerprint — only for hoodie-both)
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [photo2Error, setPhoto2Error] = useState('');
  const [dragCounter2, setDragCounter2] = useState(0);
  const file2InputRef = useRef<HTMLInputElement>(null);

  // Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState('');

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const needsSecondPhoto = selectedProduct?.id === 'hoodie-both';

  useEffect(() => {
    if (!photo) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!photo2) { setPhoto2Preview(null); return; }
    const url = URL.createObjectURL(photo2);
    setPhoto2Preview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo2]);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  const handleFile = useCallback((file: File, slot: 1 | 2) => {
    const setErr = slot === 1 ? setPhotoError : setPhoto2Error;
    const setF = slot === 1 ? setPhoto : setPhoto2;
    const ref = slot === 1 ? fileInputRef : file2InputRef;
    setErr('');
    const error = validateFile(file, t);
    if (error) { setErr(error); return; }
    setF(file);
    if (ref.current) ref.current.value = '';
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, slot: 1 | 2) => {
    e.preventDefault();
    if (slot === 1) setDragCounter(0); else setDragCounter2(0);
    if (e.dataTransfer.files.length > 1) {
      if (slot === 1) setPhotoError(t.errorMultipleFiles);
      else setPhoto2Error(t.errorMultipleFiles);
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, slot);
  }, [handleFile, t]);

  const products = productType ? getProducts(productType) : [];

  const canAdvanceStep1 =
    productType !== null &&
    selectedProduct !== null &&
    (productType === 'paint-kit' || selectedSize !== null);

  const canAdvanceStep2 =
    photo !== null && (!needsSecondPhoto || photo2 !== null);

  const isEmailValid = EMAIL_REGEX.test(email);
  const canSubmit = name.trim().length >= 2 && isEmailValid;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || !photo || !selectedProduct) return;

    setSubmitting(true);
    setSubmitError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMISSION_TIMEOUT);

    const ref = generateOrderRef();

    try {
      const photoUrl = await uploadPhoto(photo, controller.signal, t.errorUploadFailed);
      const photo2Url = needsSecondPhoto && photo2
        ? await uploadPhoto(photo2, controller.signal, t.errorUploadFailed)
        : null;

      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_KEY);
      formData.append('subject', `New Pet & Paint Order ${ref} — ${name}`);
      formData.append('from_name', 'Pet & Paint');
      formData.append('email', email);
      formData.append('Order Reference', ref);
      formData.append('Customer Name', name);
      formData.append('Product Type', productType === 'hoodie' ? 'Hoodie' : 'Paint Kit');
      formData.append('Style', selectedProduct.name);
      formData.append('Price', formatPrice(selectedProduct.price));
      if (productType === 'hoodie' && selectedSize) {
        formData.append('Size', selectedSize);
      }
      if (instructions.trim()) {
        formData.append('Special Instructions', instructions);
      }
      formData.append('Pet Photo URL', photoUrl);
      if (photo2Url) {
        formData.append('Fingerprint Photo URL', photo2Url);
      }

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.success) {
        setOrderRef(ref);
        setSubmitted(true);
      } else {
        setSubmitError(data.message || t.errorGeneric);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setSubmitError(t.errorTimeout);
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError(t.errorNetwork);
      }
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif font-bold text-brand-brown">{t.successTitle}</h2>
        <p className="text-brand-brown/70 max-w-md mx-auto">
          {lang === 'es' ? `¡Gracias, ${name}! ` : `Thank you, ${name}! `}
          {t.successBody} <strong>{email}</strong> {t.successSuffix}
        </p>
        {orderRef && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-brand-cream rounded-full px-5 py-2 text-sm">
              <span className="text-brand-brown/70">{t.successOrderRef}</span>
              <span className="font-mono font-bold text-brand-brown tracking-wider">{orderRef}</span>
            </div>
            <p className="text-xs text-brand-brown/60">{t.successSaveRef}</p>
          </div>
        )}
        <p className="text-sm text-brand-brown/60 max-w-md mx-auto bg-brand-cream/60 rounded-xl px-4 py-3">
          {t.successResponseTime}
        </p>
        <div>
          <a href="/shop" className={`inline-block mt-4 ${primaryBtn}`}>
            {t.backToShop}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={step} labels={[t.stepChooseProduct, t.stepUploadPhoto, t.stepYourDetails]} />

      {/* Step 1: Choose Product */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-serif font-bold text-brand-brown outline-none">
            {t.step2Title}
          </h2>

          {/* Product type cards */}
          <div className="grid grid-cols-2 gap-4">
            {(['hoodie', 'paint-kit'] as const).map((type) => {
              const meta = productTypeMeta[type];
              const isSelected = productType === type;
              return (
                <button
                  key={type}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setProductType(type);
                    setSelectedProduct(null);
                    setSelectedSize(null);
                    setPhoto2(null);
                    setPhoto2Error('');
                  }}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${selectionClass(isSelected)}`}
                >
                  <div className="text-2xl mb-2">{meta.emoji}</div>
                  <h3 className="font-serif font-bold text-brand-brown">{meta.label}</h3>
                  <p className="text-sm text-brand-brown/70">{t.step2From} {formatPrice(getMinPrice(type))}</p>
                </button>
              );
            })}
          </div>

          {/* Design selection */}
          {productType && (
            <div className="space-y-3">
              <h3 className="font-semibold text-brand-brown">{t.step2SelectStyle}</h3>
              <div className="flex flex-col gap-3">
                {products.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <button
                      key={product.id}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedProduct(product);
                        if (product.id !== 'hoodie-both') {
                          setPhoto2(null);
                          setPhoto2Error('');
                        }
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectionClass(isSelected)}`}
                    >
                      <span className="text-2xl mr-3">{PRODUCT_DESIGN_EMOJI[product.id]}</span>
                      <span className="text-sm font-semibold text-brand-brown">{getDesignLabel(product.id, t)}</span>
                      <p className="text-brand-orange font-bold mt-1">{formatPrice(product.price)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector for hoodies */}
          {productType === 'hoodie' && selectedProduct && (
            <div className="space-y-3">
              <h3 className="font-semibold text-brand-brown">{t.step2SelectSize}</h3>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all ${
                        isSelected
                          ? 'border-brand-orange bg-brand-orange text-white'
                          : 'border-brand-tan text-brand-brown hover:border-brand-brown/40'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button disabled={!canAdvanceStep1} onClick={() => setStep(2)} className={primaryBtn}>
              {t.next}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Photo(s) */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-serif font-bold text-brand-brown outline-none">
            {getPhotoStepTitle(selectedProduct?.id, t)}
          </h2>
          {!needsSecondPhoto && (
            <p className="text-brand-brown/70 text-sm">
              {getPhotoStepHint(selectedProduct?.id, t)}
            </p>
          )}

          {needsSecondPhoto ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UploadZone
                label={t.photoLabelFace}
                preview={photoPreview}
                fileName={photo?.name}
                error={photoError}
                dragActive={dragCounter > 0}
                inputRef={fileInputRef}
                ariaLabel={t.step1AriaLabel}
                hint={t.step1UploadHint}
                onFileChange={(file) => handleFile(file, 1)}
                onDrop={(e) => handleDrop(e, 1)}
                onDragEnter={() => setDragCounter((c) => c + 1)}
                onDragLeave={() => setDragCounter((c) => Math.max(0, c - 1))}
                t={t}
              />
              <UploadZone
                label={t.photoLabelFingerprint}
                preview={photo2Preview}
                fileName={photo2?.name}
                error={photo2Error}
                dragActive={dragCounter2 > 0}
                inputRef={file2InputRef}
                ariaLabel={t.photoLabelFingerprint}
                hint={t.photoHintFingerprint}
                onFileChange={(file) => handleFile(file, 2)}
                onDrop={(e) => handleDrop(e, 2)}
                onDragEnter={() => setDragCounter2((c) => c + 1)}
                onDragLeave={() => setDragCounter2((c) => Math.max(0, c - 1))}
                t={t}
              />
            </div>
          ) : (
            <UploadZone
              preview={photoPreview}
              fileName={photo?.name}
              error={photoError}
              dragActive={dragCounter > 0}
              inputRef={fileInputRef}
              ariaLabel={t.step1AriaLabel}
              hint={t.step1UploadHint}
              onFileChange={(file) => handleFile(file, 1)}
              onDrop={(e) => handleDrop(e, 1)}
              onDragEnter={() => setDragCounter((c) => c + 1)}
              onDragLeave={() => setDragCounter((c) => Math.max(0, c - 1))}
              t={t}
            />
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className={backBtn}>
              {t.back}
            </button>
            <button disabled={!canAdvanceStep2} onClick={() => setStep(3)} className={primaryBtn}>
              {t.next}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details + Review */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Order details">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-serif font-bold text-brand-brown outline-none">
            {t.step3Title}
          </h2>

          <div className="space-y-4">
            <FormField label={t.fieldName} required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
                className={inputClass}
                placeholder={t.placeholderName}
              />
            </FormField>

            <FormField label={t.fieldEmail} required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                className={inputClass}
                placeholder={t.placeholderEmail}
              />
            </FormField>

            <FormField label={t.fieldInstructions}>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                maxLength={500}
                className={`${inputClass} resize-none`}
                placeholder={t.placeholderInstructions}
              />
              <p className="text-xs text-brand-brown/50 mt-1 text-right">
                {instructions.length}/500
              </p>
            </FormField>
          </div>

          {/* Order summary */}
          <div className="bg-brand-cream rounded-2xl p-5 space-y-3">
            <h3 className="font-serif font-bold text-brand-brown">{t.summaryTitle}</h3>
            <div className="flex gap-4">
              <div className="flex gap-2 shrink-0">
                {photoPreview && (
                  <img src={photoPreview} alt="Your pet" className="w-20 h-20 rounded-lg object-cover" />
                )}
                {photo2Preview && (
                  <img src={photo2Preview} alt="Fingerprint" className="w-20 h-20 rounded-lg object-cover" />
                )}
              </div>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-brand-brown">
                  {selectedProduct && getDesignLabel(selectedProduct.id, t)}
                </p>
                {productType === 'hoodie' && selectedSize && (
                  <p className="text-brand-brown/70">{t.summarySize} {selectedSize}</p>
                )}
                <p className="text-brand-orange font-bold text-base">
                  {selectedProduct && formatPrice(selectedProduct.price)}
                </p>
              </div>
            </div>
          </div>

          {submitError && <ErrorMessage message={submitError} id="submit-error" />}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className={backBtn}>
              {t.back}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`${primaryBtn} flex items-center gap-2`}
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
