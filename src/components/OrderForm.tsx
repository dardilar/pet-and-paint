import { useState, useRef, useEffect, useCallback } from 'react';
import {
  SIZES,
  getProducts,
  getMinPrice,
  formatPrice,
  type Product,
  type ProductType,
  type Size,
} from '../data/products';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMISSION_TIMEOUT = 60_000;
const WEB3FORMS_KEY = '75cbccb4-df9c-4a93-a1d4-752af4b4e6d0';

// Cloudinary unsigned upload — replace with your cloud name and upload preset
const CLOUDINARY_CLOUD = 'db7dz8rue';
const CLOUDINARY_PRESET = 'petandpaint';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

async function uploadPhoto(file: File, signal: AbortSignal): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);
  data.append('folder', 'pet-and-paint-orders');

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data, signal });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'Photo upload failed. Please try again.');
  }
  return json.secure_url;
}

const PRODUCT_TYPE_META: Record<ProductType, { label: string; emoji: string }> = {
  hoodie: { label: 'Hoodie', emoji: '\uD83E\uDDE5' },
  'paint-kit': { label: 'Paint Kit', emoji: '\uD83C\uDFA8' },
};

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

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'File must be under 10MB.';
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Please upload a JPEG, PNG, or WebP image.';
  return null;
}

// --- Sub-components ---

function StepIndicator({ current }: { current: number }) {
  const labels = ['Upload Photo', 'Choose Product', 'Your Details'];
  return (
    <ol className="flex items-center justify-center gap-2 mb-8" aria-label="Order progress">
      {labels.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        return (
          <li key={label} className="flex items-center gap-2">
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
                {isCompleted ? '\u2713' : step}
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

// --- Main component ---

export default function OrderForm() {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Clean up object URL when photo changes or component unmounts
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Move focus to step heading on step change
  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  const handleFile = useCallback((file: File) => {
    setPhotoError('');
    const error = validateFile(file);
    if (error) {
      setPhotoError(error);
      return;
    }
    setPhoto(file);
    // Reset file input so re-uploading the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragCounter(0);
      if (e.dataTransfer.files.length > 1) {
        setPhotoError('Please upload only one photo at a time.');
        return;
      }
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const products = productType ? getProducts(productType) : [];

  const canAdvanceStep2 =
    productType !== null &&
    selectedProduct !== null &&
    (productType === 'paint-kit' || selectedSize !== null);

  const isEmailValid = EMAIL_REGEX.test(email);
  const canSubmit = name.trim().length >= 2 && isEmailValid;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || !photo || !selectedProduct) return;

    setSubmitting(true);
    setSubmitError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMISSION_TIMEOUT);

    try {
      // 1. Upload photo to Cloudinary
      const photoUrl = await uploadPhoto(photo, controller.signal);

      // 2. Send order details + photo URL via Web3Forms
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_KEY);
      formData.append('subject', `New Pet & Paint Order from ${name}`);
      formData.append('Customer Name', name);
      formData.append('Email', email);
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

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setSubmitError('Request timed out. Please check your connection and try again.');
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Network error. Please check your connection and try again.');
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
        <h2 className="text-2xl font-serif font-bold text-brand-brown">Order Received!</h2>
        <p className="text-brand-brown/70 max-w-md mx-auto">
          Thank you, {name}! We've received your order and will review your pet photo.
          You'll receive a payment link at <strong>{email}</strong> shortly.
        </p>
        <a
          href="/shop"
          className={`inline-block mt-4 ${primaryBtn}`}
        >
          Back to Shop
        </a>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={step} />

      {/* Step 1: Upload Photo */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-serif font-bold text-brand-brown outline-none">
            Upload Your Pet Photo
          </h2>
          <p className="text-brand-brown/70 text-sm">
            Upload a clear photo of your pet. JPEG, PNG, or WebP up to 10MB.
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-label="Upload pet photo — click to select file or drag and drop"
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              dragCounter > 0
                ? 'border-brand-orange bg-brand-orange/5'
                : photoPreview
                  ? 'border-brand-brown/30'
                  : 'border-brand-tan hover:border-brand-orange'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => { e.preventDefault(); setDragCounter((c) => c + 1); }}
            onDragLeave={() => setDragCounter((c) => Math.max(0, c - 1))}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {photoPreview ? (
              <div className="space-y-3">
                <img
                  src={photoPreview}
                  alt="Pet preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-brand-brown/70">{photo?.name} — Click or drop to replace</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <svg className="w-12 h-12 mx-auto text-brand-tan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-brand-brown font-medium">Click to upload or drag & drop</p>
                <p className="text-sm text-brand-brown/50">JPEG, PNG, or WebP up to 10MB</p>
              </div>
            )}
          </div>

          {photoError && <ErrorMessage message={photoError} id="photo-error" />}

          <div className="flex justify-end">
            <button disabled={!photo} onClick={() => setStep(2)} className={primaryBtn}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Product */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-serif font-bold text-brand-brown outline-none">
            Choose Your Product
          </h2>

          {/* Product type cards */}
          <div className="grid grid-cols-2 gap-4">
            {(['hoodie', 'paint-kit'] as const).map((type) => {
              const meta = PRODUCT_TYPE_META[type];
              const isSelected = productType === type;
              return (
                <button
                  key={type}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setProductType(type);
                    setSelectedProduct(null);
                    setSelectedSize(null);
                  }}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${selectionClass(isSelected)}`}
                >
                  <div className="text-2xl mb-2">{meta.emoji}</div>
                  <h3 className="font-serif font-bold text-brand-brown">{meta.label}</h3>
                  <p className="text-sm text-brand-brown/70">from {formatPrice(getMinPrice(type))}</p>
                </button>
              );
            })}
          </div>

          {/* Style selection */}
          {productType && (
            <div className="space-y-3">
              <h3 className="font-semibold text-brand-brown">Select a Style</h3>
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <button
                      key={product.id}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectionClass(isSelected)}`}
                    >
                      <p className="text-sm font-semibold text-brand-brown">{product.name}</p>
                      <p className="text-brand-orange font-bold">{formatPrice(product.price)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector for hoodies */}
          {productType === 'hoodie' && selectedProduct && (
            <div className="space-y-3">
              <h3 className="font-semibold text-brand-brown">Select a Size</h3>
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

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className={backBtn}>
              &larr; Back
            </button>
            <button disabled={!canAdvanceStep2} onClick={() => setStep(3)} className={primaryBtn}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details + Review */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Order details">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-serif font-bold text-brand-brown outline-none">
            Your Details & Review
          </h2>

          <div className="space-y-4">
            <FormField label="Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
                className={inputClass}
                placeholder="Your full name"
              />
            </FormField>

            <FormField label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                className={inputClass}
                placeholder="you@email.com"
              />
            </FormField>

            <FormField label="Special Instructions">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                maxLength={500}
                className={`${inputClass} resize-none`}
                placeholder="Any specific requests for your order..."
              />
              <p className="text-xs text-brand-brown/50 mt-1 text-right">
                {instructions.length}/500
              </p>
            </FormField>
          </div>

          {/* Order summary */}
          <div className="bg-brand-cream rounded-2xl p-5 space-y-3">
            <h3 className="font-serif font-bold text-brand-brown">Order Summary</h3>
            <div className="flex gap-4">
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Your pet"
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="text-sm space-y-1">
                <p className="font-semibold text-brand-brown">{selectedProduct?.name}</p>
                {productType === 'hoodie' && selectedSize && (
                  <p className="text-brand-brown/70">Size: {selectedSize}</p>
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
              &larr; Back
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
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
