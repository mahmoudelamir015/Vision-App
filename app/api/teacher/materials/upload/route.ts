import { NextResponse } from "next/server";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppProfile();
    const role = profile?.role as string;
    if (!profile || (role !== "teacher" && role !== "master_admin")) {
      return NextResponse.json({ error: "غير مصرح لك برفع المحتوى" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "محتوى تعليمي";
    const subject = (formData.get("subject") as string) || null;
    const price = Number(formData.get("price") || 0);

    if (!file) {
      return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const bucketName = "teacher_materials";

    // 1. Ensure bucket exists
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
    if (bucketError || !bucket) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });
    }

    // 2. Upload file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFileName = file.name.replace(/[^\w.-]+/g, "_");
    const storagePath = `${profile.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `فشل رفع الملف: ${uploadError.message}` }, { status: 400 });
    }

    // 3. Get Public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    const fileUrl = publicUrlData.publicUrl;

    // 4. Create Material Record in Database
    const { data: material, error: dbError } = await supabase
      .from("teacher_materials")
      .insert({
        teacher_user_id: profile.id,
        title,
        subject,
        price,
        file_url: fileUrl,
        file_name: file.name,
        file_type: file.type,
        published: true,
      })
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: `فشل حفظ البيانات: ${dbError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, material });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع عند الرفع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
