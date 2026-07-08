import { useState, useRef, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import {
  PRODUCTS,
  STYLES,
  STYLE_KEYS,
  SIZES,
  formatPrice,
  getPrice,
  getMinPrice,
  type ProductKey,
  type StyleKey,
  type Size,
} from '../data/products';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_NOTES_LENGTH = 500;
const SUBMISSION_TIMEOUT = 60_000;
const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY;

const CLOUDINARY_CLOUD = import.meta.env.PUBLIC_CLOUDINARY_CLOUD;
const CLOUDINARY_PRESET = import.meta.env.PUBLIC_CLOUDINARY_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const TEXT = {
  stepChooseProduct: 'Elegir Producto',
  stepUploadPhoto: 'Subir Foto',
  stepYourDetails: 'Tus Datos',
  step1Title: 'Elige tu producto',
  step1From: 'desde',
  step1SelectStyle: 'Selecciona un estilo',
  step1SelectSize: 'Selecciona una talla',
  step2Title: 'Sube la foto de tu mascota',
  step2TitleBoth: 'Sube las fotos de tu mascota',
  photoHintFace: 'Sube una foto clara de tu mascota, con buena luz y de frente. JPEG, PNG o WebP de hasta 10 MB.',
  photoHintPaw: 'Sube una foto clara de la huella de tu mascota. JPEG, PNG o WebP de hasta 10 MB.',
  photoHintBoth: 'Sube una foto de la cara de tu mascota y otra de su huella. JPEG, PNG o WebP de hasta 10 MB cada una.',
  photoLabelFace: 'Foto de tu mascota',
  photoLabelPaw: 'Foto de la huella',
  uploadCta: 'Haz clic para subir o arrastra y suelta',
  uploadHint: 'JPEG, PNG o WebP de hasta 10 MB',
  photoReady: '✓ Foto lista',
  changePhoto: 'Cambiar',
  step3Title: 'Tus datos y revisión',
  fieldName: 'Nombre',
  fieldEmail: 'Correo electrónico',
  fieldInstructions: 'Instrucciones especiales',
  placeholderName: 'Tu nombre completo',
  placeholderEmail: 'tu@correo.com',
  placeholderInstructions: 'Cualquier solicitud específica para tu pedido…',
  summaryTitle: 'Resumen del pedido',
  summarySize: 'Talla:',
  summaryKitDetail: 'Kit completo con lienzo y pinturas',
  next: 'Siguiente →',
  back: '← Atrás',
  submit: 'Enviar pedido',
  submitting: 'Enviando…',
  successTitle: (firstName: string) => `¡Pedido recibido, ${firstName}!`,
  successOrderRef: 'Referencia de pedido:',
  successSaveRef: 'Guarda esta referencia para cualquier consulta sobre tu pedido.',
  successNote: 'Solo pagas cuando confirmamos tu foto · Producción: 5–7 días hábiles.',
  viewProducts: 'Ver productos',
  newOrder: 'Hacer otro pedido',
  errorFileSize: 'El archivo supera los 10 MB. Por favor sube una imagen más liviana.',
  errorFileType: 'Formato no permitido. Sube una imagen JPEG, PNG o WebP.',
  errorMultipleFiles: 'Por favor sube un solo archivo a la vez.',
  errorUploadFailed: 'No pudimos subir la foto. Inténtalo de nuevo.',
  errorTimeout: 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
  errorNetwork: 'Error de red. Revisa tu conexión e inténtalo de nuevo.',
  errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
};

async function uploadPhoto(file: File, signal: AbortSignal): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);
  data.append('folder', 'pet-and-paint-orders');

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data, signal });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || TEXT.errorUploadFailed);
  }
  return json.secure_url;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return TEXT.errorFileSize;
  if (!ACCEPTED_TYPES.includes(file.type)) return TEXT.errorFileType;
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

// --- Shared styles ---

const primaryBtn =
  'bg-brand-brown text-white px-7 py-3 rounded-full font-bold shadow-md shadow-brand-brown/25 hover:bg-brand-dark transition-colors disabled:bg-brand-tan disabled:shadow-none disabled:cursor-not-allowed';
const submitBtn =
  'bg-brand-orange text-white px-7 py-3 rounded-full font-bold shadow-md shadow-brand-orange/25 hover:bg-brand-brown transition-colors disabled:bg-brand-tan disabled:shadow-none disabled:cursor-not-allowed';
const backBtn = 'text-brand-brown hover:text-brand-orange transition-colors font-bold text-sm py-2';
const inputClass =
  'w-full px-4 py-3 rounded-2xl border-[1.5px] border-brand-tan bg-[#FAF7F3] text-brand-dark placeholder:text-[#B8A794] focus:border-brand-orange focus:bg-white focus:outline-none transition-colors';

function cardClass(isSelected: boolean) {
  return isSelected
    ? 'border-2 border-brand-orange bg-[#FFF7F0]'
    : 'border-2 border-brand-tan bg-white hover:border-brand-orange/60';
}

// --- Sub-components ---

function StepIndicator({
  current,
  labels,
  onStepClick,
}: {
  current: number;
  labels: [string, string, string];
  onStepClick: (step: number) => void;
}) {
  return (
    <ol className="flex items-start justify-center mb-10" aria-label="Progreso del pedido">
      {labels.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        return (
          <li key={i} className="flex items-start">
            {i > 0 && (
              <div className={`w-8 sm:w-11 h-0.5 mt-5 ${isCompleted || isActive ? 'bg-brand-brown' : 'bg-brand-tan'}`} />
            )}
            <div className="flex flex-col items-center gap-2 w-[76px] sm:w-[92px]">
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                disabled={!isCompleted}
                onClick={() => isCompleted && onStepClick(step)}
                className={`w-10 h-10 rounded-full grid place-items-center text-[15px] font-extrabold transition-colors ${
                  isCompleted
                    ? 'bg-brand-brown text-white cursor-pointer'
                    : isActive
                      ? 'bg-brand-orange text-white cursor-default'
                      : 'bg-brand-tan text-[#8A6E4B] cursor-default'
                }`}
              >
                {isCompleted ? '✓' : step}
              </button>
              <span className={`text-xs text-center ${isActive ? 'font-extrabold text-brand-dark' : 'font-semibold text-[#8A6E4B]'}`}>
                {label}
              </span>
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

function UploadZone({
  label,
  preview,
  fileName,
  error,
  dragActive,
  inputRef,
  ariaLabel,
  onFileChange,
  onRemove,
  onDrop,
  onDragEnter,
  onDragLeave,
}: {
  label?: string;
  preview: string | null;
  fileName?: string;
  error: string;
  dragActive: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  ariaLabel: string;
  onFileChange: (file: File) => void;
  onRemove: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-extrabold text-brand-dark">{label}</p>}
      {preview ? (
        <div className="flex items-center gap-4 border-[1.5px] border-brand-tan rounded-2xl p-4 bg-[#FAF7F3]">
          <img src={preview} alt="Vista previa de la foto" className="w-24 h-24 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-brand-dark truncate mb-0.5">{fileName}</div>
            <div className="text-[13px] font-bold text-[#6B8F71]">{TEXT.photoReady}</div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="bg-white border-[1.5px] border-brand-tan rounded-full text-[13px] font-bold text-brand-brown px-4 py-2 hover:border-brand-orange hover:text-brand-orange transition-colors shrink-0"
          >
            {TEXT.changePhoto}
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          className={`grid place-items-center gap-1 border-2 border-dashed rounded-[20px] px-6 py-12 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-brand-orange bg-[#FFF9F3]'
              : 'border-[#D4C4B2] bg-[#FAF7F3] hover:border-brand-orange hover:bg-[#FFF9F3]'
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
          <span className="w-[52px] h-[52px] rounded-full bg-brand-tan grid place-items-center text-[22px] mb-2" aria-hidden="true">📷</span>
          <span className="text-[15px] font-bold text-brand-dark">{TEXT.uploadCta}</span>
          <span className="text-xs text-[#8A6E4B]">{TEXT.uploadHint}</span>
        </div>
      )}
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
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

// --- Main component ---

export default function OrderForm() {
  const [step, setStep] = useState(1);

  // Product selection
  const [product, setProduct] = useState<ProductKey | null>(null);
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  // Primary photo (pet face / paw depending on style)
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Secondary photo (paw — only when style is "both")
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
  const botcheckRef = useRef<HTMLInputElement>(null);

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const needsSecondPhoto = style === 'both';
  const needsSize = product === 'hoodie';

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
    const error = validateFile(file);
    if (error) { setErr(error); return; }
    setF(file);
    if (ref.current) ref.current.value = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, slot: 1 | 2) => {
    e.preventDefault();
    if (slot === 1) setDragCounter(0); else setDragCounter2(0);
    if (e.dataTransfer.files.length > 1) {
      if (slot === 1) setPhotoError(TEXT.errorMultipleFiles);
      else setPhoto2Error(TEXT.errorMultipleFiles);
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, slot);
  }, [handleFile]);

  const canAdvanceStep1 = product !== null && style !== null && (!needsSize || size !== null);
  const canAdvanceStep2 = photo !== null && (!needsSecondPhoto || photo2 !== null);
  const canSubmit = name.trim().length >= 2 && EMAIL_REGEX.test(email.trim());

  const photoHint =
    style === 'paw' ? TEXT.photoHintPaw : style === 'both' ? TEXT.photoHintBoth : TEXT.photoHintFace;

  const summaryTitle = product && style ? `${PRODUCTS[product].name} — ${STYLES[style].name}` : '';
  const summaryDetail = product === 'hoodie' ? `${TEXT.summarySize} ${size ?? ''}` : TEXT.summaryKitDetail;
  const price = product && style ? getPrice(product, style) : 0;
  const firstName = name.trim().split(' ')[0] || 'amigo';

  const resetForm = () => {
    setStep(1);
    setProduct(null);
    setStyle(null);
    setSize(null);
    setPhoto(null);
    setPhotoError('');
    setPhoto2(null);
    setPhoto2Error('');
    setName('');
    setEmail('');
    setInstructions('');
    setSubmitError('');
    setSubmitted(false);
    setOrderRef('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || !photo || !product || !style || submitting) return;
    // Honeypot: silently drop bot submissions
    if (botcheckRef.current?.checked) return;

    setSubmitting(true);
    setSubmitError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMISSION_TIMEOUT);

    const ref = generateOrderRef();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    try {
      const photoUrl = await uploadPhoto(photo, controller.signal);
      const photo2Url = needsSecondPhoto && photo2
        ? await uploadPhoto(photo2, controller.signal)
        : null;

      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_KEY);
      formData.append('subject', `New Pet & Paint Order ${ref} — ${trimmedName}`);
      formData.append('from_name', 'Pet & Paint');
      formData.append('botcheck', '');
      formData.append('email', trimmedEmail);
      formData.append('Order Reference', ref);
      formData.append('Customer Name', trimmedName);
      formData.append('Product', PRODUCTS[product].name);
      formData.append('Style', STYLES[style].name);
      formData.append('Price', formatPrice(price));
      if (needsSize && size) {
        formData.append('Size', size);
      }
      if (instructions.trim()) {
        formData.append('Special Instructions', instructions.trim());
      }
      formData.append('Pet Photo URL', photoUrl);
      if (photo2Url) {
        formData.append('Paw Photo URL', photo2Url);
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
        setSubmitError(data.message || TEXT.errorGeneric);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setSubmitError(TEXT.errorTimeout);
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError(TEXT.errorNetwork);
      }
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white border border-brand-tan rounded-3xl px-6 sm:px-12 py-10 sm:py-16 text-center shadow-lg shadow-brand-dark/5 space-y-5">
        <span className="inline-grid place-items-center w-[72px] h-[72px] rounded-full bg-[#EAF2EC] text-[#6B8F71] text-[32px]" aria-hidden="true">✓</span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-dark">
          {TEXT.successTitle(firstName)}
        </h2>
        <p className="text-brand-brown leading-relaxed max-w-md mx-auto">
          Te enviamos la confirmación a <strong>{email.trim()}</strong>. Revisaremos la foto de tu mascota
          y, una vez aprobada, recibirás en tu correo el <strong>link de pago seguro</strong> para tu {summaryTitle}.
        </p>
        {orderRef && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-brand-cream rounded-full px-5 py-2 text-sm">
              <span className="text-brand-brown/70">{TEXT.successOrderRef}</span>
              <span className="font-mono font-bold text-brand-dark tracking-wider">{orderRef}</span>
            </div>
            <p className="text-xs text-brand-brown/60">{TEXT.successSaveRef}</p>
          </div>
        )}
        <p className="text-sm text-[#8A6E4B]">{TEXT.successNote}</p>
        <div className="flex gap-3 justify-center flex-wrap pt-2">
          <a href="/productos" className={submitBtn}>
            {TEXT.viewProducts}
          </a>
          <button
            type="button"
            onClick={resetForm}
            className="bg-white border-[1.5px] border-brand-tan rounded-full font-bold text-brand-dark px-7 py-3 hover:border-brand-brown transition-colors"
          >
            {TEXT.newOrder}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator
        current={step}
        labels={[TEXT.stepChooseProduct, TEXT.stepUploadPhoto, TEXT.stepYourDetails]}
        onStepClick={setStep}
      />

      <div className="bg-white border border-brand-tan rounded-3xl p-6 sm:p-10 shadow-lg shadow-brand-dark/5">
        {/* Step 1: Choose Product */}
        {step === 1 && (
          <div>
            <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-extrabold text-brand-dark outline-none mb-5">
              {TEXT.step1Title}
            </h2>

            {/* Product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-7">
              {(Object.keys(PRODUCTS) as ProductKey[]).map((key) => {
                const isSelected = product === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setProduct(key);
                      if (key !== 'hoodie') setSize(null);
                    }}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl p-5 text-left transition-colors ${cardClass(isSelected)}`}
                  >
                    <span className="text-[26px]" aria-hidden="true">{PRODUCTS[key].emoji}</span>
                    <span className="font-extrabold text-brand-dark">{PRODUCTS[key].name}</span>
                    <span className="text-[13px] font-semibold text-[#8A6E4B]">
                      {TEXT.step1From} {formatPrice(getMinPrice(key))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Style selection */}
            {product && (
              <div className="mb-7">
                <h3 className="font-extrabold text-brand-dark mb-3.5">{TEXT.step1SelectStyle}</h3>
                <div className="flex flex-col gap-3">
                  {STYLE_KEYS.map((key) => {
                    const isSelected = style === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setStyle(key);
                          if (key !== 'both') {
                            setPhoto2(null);
                            setPhoto2Error('');
                          }
                        }}
                        className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-colors ${cardClass(isSelected)}`}
                      >
                        <span className="flex items-center gap-2.5 font-bold text-brand-dark">
                          <span className="text-lg" aria-hidden="true">{STYLES[key].emoji}</span>
                          {STYLES[key].name}
                        </span>
                        <span className="font-extrabold text-brand-orange">{formatPrice(getPrice(product, key))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector for hoodies */}
            {needsSize && style && (
              <div className="mb-2">
                <h3 className="font-extrabold text-brand-dark mb-3.5">{TEXT.step1SelectSize}</h3>
                <div className="flex flex-wrap gap-2.5">
                  {SIZES.map((s) => {
                    const isSelected = size === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSize(s)}
                        className={`w-[52px] h-[52px] rounded-full border-2 text-sm font-extrabold transition-colors ${
                          isSelected
                            ? 'border-brand-orange bg-brand-orange text-white'
                            : 'border-brand-tan bg-white text-brand-brown hover:border-brand-orange/60'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-7">
              <button type="button" disabled={!canAdvanceStep1} onClick={() => setStep(2)} className={primaryBtn}>
                {TEXT.next}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Photo(s) */}
        {step === 2 && (
          <div>
            <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-extrabold text-brand-dark outline-none mb-2">
              {needsSecondPhoto ? TEXT.step2TitleBoth : TEXT.step2Title}
            </h2>
            <p className="text-sm text-brand-brown leading-relaxed mb-5">{photoHint}</p>

            {needsSecondPhoto ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UploadZone
                  label={TEXT.photoLabelFace}
                  preview={photoPreview}
                  fileName={photo?.name}
                  error={photoError}
                  dragActive={dragCounter > 0}
                  inputRef={fileInputRef}
                  ariaLabel={TEXT.photoLabelFace}
                  onFileChange={(file) => handleFile(file, 1)}
                  onRemove={() => { setPhoto(null); setPhotoError(''); }}
                  onDrop={(e) => handleDrop(e, 1)}
                  onDragEnter={() => setDragCounter((c) => c + 1)}
                  onDragLeave={() => setDragCounter((c) => Math.max(0, c - 1))}
                />
                <UploadZone
                  label={TEXT.photoLabelPaw}
                  preview={photo2Preview}
                  fileName={photo2?.name}
                  error={photo2Error}
                  dragActive={dragCounter2 > 0}
                  inputRef={file2InputRef}
                  ariaLabel={TEXT.photoLabelPaw}
                  onFileChange={(file) => handleFile(file, 2)}
                  onRemove={() => { setPhoto2(null); setPhoto2Error(''); }}
                  onDrop={(e) => handleDrop(e, 2)}
                  onDragEnter={() => setDragCounter2((c) => c + 1)}
                  onDragLeave={() => setDragCounter2((c) => Math.max(0, c - 1))}
                />
              </div>
            ) : (
              <UploadZone
                preview={photoPreview}
                fileName={photo?.name}
                error={photoError}
                dragActive={dragCounter > 0}
                inputRef={fileInputRef}
                ariaLabel={TEXT.step2Title}
                onFileChange={(file) => handleFile(file, 1)}
                onRemove={() => { setPhoto(null); setPhotoError(''); }}
                onDrop={(e) => handleDrop(e, 1)}
                onDragEnter={() => setDragCounter((c) => c + 1)}
                onDragLeave={() => setDragCounter((c) => Math.max(0, c - 1))}
              />
            )}

            <div className="flex justify-between items-center mt-7">
              <button type="button" onClick={() => setStep(1)} className={backBtn}>
                {TEXT.back}
              </button>
              <button type="button" disabled={!canAdvanceStep2} onClick={() => setStep(3)} className={primaryBtn}>
                {TEXT.next}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Details + Review */}
        {step === 3 && (
          <form onSubmit={handleSubmit} aria-label="Datos del pedido">
            <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-extrabold text-brand-dark outline-none mb-5">
              {TEXT.step3Title}
            </h2>

            {/* Honeypot — hidden from real users, catches bots */}
            <input
              ref={botcheckRef}
              type="checkbox"
              name="botcheck"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <label className="block text-sm font-extrabold text-brand-dark mb-1.5" htmlFor="order-name">
              {TEXT.fieldName} <span className="text-brand-orange">*</span>
            </label>
            <input
              id="order-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              maxLength={MAX_NAME_LENGTH}
              autoComplete="name"
              className={`${inputClass} mb-4`}
              placeholder={TEXT.placeholderName}
            />

            <label className="block text-sm font-extrabold text-brand-dark mb-1.5" htmlFor="order-email">
              {TEXT.fieldEmail} <span className="text-brand-orange">*</span>
            </label>
            <input
              id="order-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              maxLength={MAX_EMAIL_LENGTH}
              autoComplete="email"
              className={`${inputClass} mb-4`}
              placeholder={TEXT.placeholderEmail}
            />

            <label className="block text-sm font-extrabold text-brand-dark mb-1.5" htmlFor="order-notes">
              {TEXT.fieldInstructions}
            </label>
            <textarea
              id="order-notes"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              maxLength={MAX_NOTES_LENGTH}
              className={`${inputClass} resize-y`}
              placeholder={TEXT.placeholderInstructions}
            />
            <p className="text-xs text-[#8A6E4B] text-right mt-1 mb-5">
              {instructions.length}/{MAX_NOTES_LENGTH}
            </p>

            {/* Order summary */}
            <div className="bg-brand-cream rounded-2xl px-5 py-5">
              <div className="font-extrabold text-brand-dark mb-3.5">{TEXT.summaryTitle}</div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2 shrink-0">
                  {photoPreview && (
                    <img src={photoPreview} alt="Foto de tu mascota" className="w-16 h-16 rounded-xl object-cover" />
                  )}
                  {photo2Preview && (
                    <img src={photo2Preview} alt="Foto de la huella" className="w-16 h-16 rounded-xl object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-brand-dark">{summaryTitle}</div>
                  <div className="text-sm text-brand-brown mt-0.5">{summaryDetail}</div>
                </div>
                <div className="text-lg font-extrabold text-brand-orange shrink-0">{formatPrice(price)}</div>
              </div>
            </div>

            {submitError && (
              <div className="mt-4">
                <ErrorMessage message={submitError} id="submit-error" />
              </div>
            )}

            <div className="flex justify-between items-center mt-7">
              <button type="button" onClick={() => setStep(2)} className={backBtn}>
                {TEXT.back}
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={`${submitBtn} flex items-center gap-2`}
              >
                {submitting && (
                  <svg className="w-4 h-4 animate-spin" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {submitting ? TEXT.submitting : TEXT.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
