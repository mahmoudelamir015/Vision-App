'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleDashed, Save, ShieldCheck, UserCircle2, MessageSquareText } from 'lucide-react';
import { OptionalPhotoPicker } from '@/components/registration/optional-photo-picker';

type Role = 'student' | 'parent' | 'teacher';

type ProfileRecord = {
  id?: string;
  role?: string;
  name?: string;
  phone?: string;
  stage?: string;
  grade?: string;
  track?: string;
  school_name?: string;
  student_code?: string;
  profile_image?: string;
  subjects?: string[];
};

type ChangeRequestField = 'phone' | 'student_code' | 'stage' | 'grade' | 'track' | 'school_name' | 'subjects' | 'profile_image';

type ProfileEditorProps = {
  role: Role;
  title: string;
  description: string;
  showPhoto?: boolean;
  editableStage?: boolean;
};

const allowedFieldLabels: Record<ChangeRequestField, string> = {
  phone: 'رقم الهاتف',
  student_code: 'كود الحساب',
  stage: 'المرحلة',
  grade: 'الصف',
  track: 'القسم',
  school_name: 'اسم المدرسة',
  subjects: 'المواد',
  profile_image: 'الصورة',
};

export function ProfileEditor({ role, title, description, showPhoto = false, editableStage = false }: ProfileEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profile, setProfile] = useState<ProfileRecord>({});
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestField, setRequestField] = useState<ChangeRequestField>('phone');
  const [requestValue, setRequestValue] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile', { cache: 'no-store' });
        const payload = (await response.json().catch(() => null)) as { profile?: ProfileRecord; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? 'تعذر تحميل الملف الشخصي');

        const nextProfile = payload?.profile ?? {};
        setProfile(nextProfile);
        setPhotoName(typeof nextProfile.profile_image === 'string' ? nextProfile.profile_image : null);
        setPhotoPreview(typeof nextProfile.profile_image === 'string' ? nextProfile.profile_image : null);
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'تعذر تحميل الملف الشخصي' });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const openRequestModal = (field: ChangeRequestField, currentValue = '') => {
    setRequestField(field);
    setRequestValue(currentValue);
    setRequestReason('');
    setRequestOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get('name') ?? '').trim();
      if (!name) throw new Error('الاسم مطلوب');

      const body: Record<string, unknown> = { name };
      if (role === 'teacher') {
        body.stage = String(formData.get('stage') ?? '').trim() || null;
        body.profile_image = photoPreview || null;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'تعذر حفظ الملف الشخصي');

      setFeedback({ type: 'success', message: 'تم حفظ البيانات بنجاح.' });
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'تعذر حفظ الملف الشخصي' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const password = window.prompt('اكتب كلمة المرور الجديدة (8 احرف على الاقل):');
    if (!password || password.trim().length < 8) return;

    setPasswordLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'تعذر تغيير كلمة المرور');
      setFeedback({ type: 'success', message: 'تم تغيير كلمة المرور بنجاح.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'تعذر تغيير كلمة المرور' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const submitChangeRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_field: requestField,
          new_value: requestValue.trim(),
          reason: requestReason.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'تعذر إرسال طلب التعديل');
      setRequestOpen(false);
      setFeedback({ type: 'success', message: 'تم إرسال الطلب للإدارة وسيتم مراجعته.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'تعذر إرسال طلب التعديل' });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const showLockedField = (field: ChangeRequestField, value: string | undefined) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500">{allowedFieldLabels[field]}</div>
          <div className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{value || '-'}</div>
        </div>
        <button
          type="button"
          onClick={() => openRequestModal(field, value || '')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] dark:border-white/10 dark:bg-black/20 dark:text-slate-300"
        >
          <MessageSquareText className="h-4 w-4" />
          طلب تعديل
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">{title}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
        </header>

        {feedback ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {feedback.message}
          </div>
        ) : null}

        <form onSubmit={handleSave} className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
              <CircleDashed className="h-5 w-5 animate-spin" />
              جاري تحميل بياناتك...
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                الاسم
                <input
                  name="name"
                  defaultValue={profile.name ?? ''}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20"
                />
              </label>

              {role === 'teacher' ? (
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  المرحلة
                  <select
                    name="stage"
                    defaultValue={profile.stage ?? ''}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20"
                  >
                    <option value="">اختر المرحلة</option>
                    <option value="primary">ابتدائي</option>
                    <option value="prep">اعدادي</option>
                    <option value="secondary">ثانوي</option>
                  </select>
                </label>
              ) : null}

              {showPhoto ? (
                <OptionalPhotoPicker
                  label="الصورة"
                  description="يمكنك اختيار صورة شخصية للملف."
                  fileName={photoName}
                  previewUrl={photoPreview}
                  onChange={(nextName, nextPreview) => {
                    setPhotoName(nextName);
                    setPhotoPreview(nextPreview);
                  }}
                />
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>{showLockedField('phone', profile.phone)}</div>
                {role === 'student' ? <div>{showLockedField('student_code', profile.student_code)}</div> : null}
                {role === 'student' ? <div>{showLockedField('stage', profile.stage)}</div> : null}
                {role === 'student' ? <div>{showLockedField('grade', profile.grade)}</div> : null}
                {role === 'student' ? <div>{showLockedField('track', profile.track)}</div> : null}
                {role === 'student' ? <div>{showLockedField('school_name', profile.school_name)}</div> : null}
                {role === 'teacher' ? <div>{showLockedField('school_name', profile.school_name)}</div> : null}
                {role === 'teacher' ? <div>{showLockedField('subjects', profile.subjects?.join('، '))}</div> : null}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">
              <Save className="h-4 w-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button type="button" onClick={handleChangePassword} disabled={passwordLoading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
              <ShieldCheck className="h-4 w-4" />
              {passwordLoading ? 'جاري تغيير كلمة المرور...' : 'تغيير كلمة المرور'}
            </button>
            <button type="button" onClick={() => router.push(`/${role}/dashboard`)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
              العودة للوحة
            </button>
          </div>
        </form>
      </div>

      {requestOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submitChangeRequest} className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">طلب تعديل</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">اطلب تعديل {allowedFieldLabels[requestField]} وارسل السبب للإدارة.</p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                القيمة الجديدة
                <input
                  value={requestValue}
                  onChange={(event) => setRequestValue(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                السبب
                <textarea
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                  className="mt-2 h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={requestSubmitting} className="rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-bold text-white disabled:opacity-70">
                {requestSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <button type="button" onClick={() => setRequestOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
