// src/app/(main)/instructor/courses/[courseId]/lectures/page.tsx
'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { courseApi, instructorApi } from '@/lib/api';
import { Course, Lecture } from '@/types';
import ConfirmModal from '@/components/ui/ConfirmModal';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const emptyForm = { title: '', description: '', video_url: '', duration: '', order_num: '' };
type VideoType = 'youtube' | 'file' | '';

export default function InstructorLecturesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 추가 폼
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [newLecture, setNewLecture] = useState(emptyForm);
  const [newVideoType, setNewVideoType] = useState<VideoType>('');
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);

  // 수정 폼
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editVideoType, setEditVideoType] = useState<VideoType>('');
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);

  // 삭제 확인 모달
  const [deleteModal, setDeleteModal] = useState<{ id: number; title: string } | null>(null);

  // 드래그앤드롭
  const draggedIdRef = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const refreshLectures = () =>
    instructorApi.getCourseLectures(Number(courseId)).then(setLectures);

  useEffect(() => {
    Promise.all([
      courseApi.getById(Number(courseId)),
      instructorApi.getCourseLectures(Number(courseId)),
    ])
      .then(([c, l]) => { setCourse(c); setLectures(l); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [courseId]);

  // ─── 추가 ──────────────────────────────────────────────────
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    // 영상 유형 미선택 또는 내용 미입력 검사
    if (!newVideoType) {
      setFormError('영상을 추가해 주세요. YouTube URL 또는 파일 업로드 중 하나를 선택해 주세요.');
      return;
    }
    if (newVideoType === 'youtube' && !newLecture.video_url.trim()) {
      setFormError('YouTube URL을 입력해 주세요.');
      return;
    }
    if (newVideoType === 'file' && !newVideoFile) {
      setFormError('업로드할 동영상 파일을 선택해 주세요.');
      return;
    }

    setFormLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', newLecture.title);
      if (newLecture.description) fd.append('description', newLecture.description);
      if (newLecture.duration) fd.append('duration', newLecture.duration);
      if (newLecture.order_num) fd.append('order_num', newLecture.order_num);
      if (newVideoType === 'youtube') fd.append('video_url', newLecture.video_url.trim());
      if (newVideoType === 'file' && newVideoFile) fd.append('video_file', newVideoFile);

      await instructorApi.createLecture(Number(courseId), fd);
      setNewLecture(emptyForm);
      setNewVideoType('');
      setNewVideoFile(null);
      setShowForm(false);
      refreshLectures();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '추가에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── 수정 ──────────────────────────────────────────────────
  const startEdit = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setEditForm({
      title: lecture.title,
      description: lecture.description ?? '',
      video_url: lecture.video_url ?? '',
      duration: String(lecture.duration ?? ''),
      order_num: String(lecture.order_num ?? ''),
    });
    // 기존 영상 유형 감지
    const existingUrl = lecture.video_url ?? '';
    if (existingUrl.startsWith('/uploads/videos/')) {
      setEditVideoType('file');
    } else if (existingUrl) {
      setEditVideoType('youtube');
    } else {
      setEditVideoType('');
    }
    setEditVideoFile(null);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditVideoType('');
    setEditVideoFile(null);
    setEditError('');
  };

  const handleEdit = async (lectureId: number) => {
    setEditError('');

    // 영상 유형 미선택 또는 내용 미입력 검사
    if (!editVideoType) {
      setEditError('영상을 추가해 주세요. YouTube URL 또는 파일 업로드 중 하나를 선택해 주세요.');
      return;
    }
    if (editVideoType === 'youtube' && !editForm.video_url.trim()) {
      setEditError('YouTube URL을 입력해 주세요.');
      return;
    }
    if (editVideoType === 'file' && !editVideoFile && !editForm.video_url.startsWith('/uploads/')) {
      setEditError('업로드할 동영상 파일을 선택해 주세요.');
      return;
    }

    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', editForm.title);
      fd.append('description', editForm.description);
      if (editForm.duration) fd.append('duration', editForm.duration);
      if (editForm.order_num) fd.append('order_num', editForm.order_num);
      if (editVideoType === 'youtube') fd.append('video_url', editForm.video_url.trim());
      if (editVideoType === 'file' && editVideoFile) fd.append('video_file', editVideoFile);
      // 기존 업로드 파일을 유지하는 경우 video_url에 기존 경로 전송
      if (editVideoType === 'file' && !editVideoFile && editForm.video_url.startsWith('/uploads/')) {
        fd.append('video_url', editForm.video_url);
      }

      await instructorApi.updateLecture(lectureId, fd);
      setEditingId(null);
      setEditForm(emptyForm);
      setEditVideoType('');
      setEditVideoFile(null);
      refreshLectures();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── 삭제 ──────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    setDeleteModal(null);
    setDeletingId(id);
    try {
      await instructorApi.deleteLecture(id);
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── 드래그앤드롭 ────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, lectureId: number) => {
    draggedIdRef.current = lectureId;
    e.dataTransfer.effectAllowed = 'move';
    // 드래그 이미지를 투명하게 하고 싶다면 생략 가능
  };

  const handleDragOver = (e: React.DragEvent, lectureId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIdRef.current !== lectureId) {
      setDragOverId(lectureId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverId(null);

    const fromId = draggedIdRef.current;
    draggedIdRef.current = null;
    if (!fromId || fromId === targetId) return;

    // 로컬 상태 재정렬
    const fromIdx = lectures.findIndex((l) => l.id === fromId);
    const toIdx   = lectures.findIndex((l) => l.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...lectures];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // order_num 재할당 (1부터 순서대로)
    const updated = reordered.map((l, i) => ({ ...l, order_num: i + 1 }));
    setLectures(updated);

    // 백엔드에 순서 저장 (video_url 기존 값 유지)
    setIsSavingOrder(true);
    try {
      await Promise.all(
        updated.map((l) => {
          const fd = new FormData();
          fd.append('title', l.title);
          fd.append('duration', String(l.duration ?? 0));
          fd.append('order_num', String(l.order_num ?? 0));
          // 기존 video_url 그대로 유지
          if (l.video_url) fd.append('video_url', l.video_url);
          return instructorApi.updateLecture(l.id, fd);
        })
      );
    } catch {
      // 실패 시 원래 순서로 복구
      refreshLectures();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    draggedIdRef.current = null;
    setDragOverId(null);
  };

  // ─── 렌더 ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <ConfirmModal
        isOpen={!!deleteModal}
        title="영상 삭제"
        message={`"${deleteModal?.title}" 영상을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal(null)}
      />

      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/instructor/courses"
          style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← 강의 목록으로
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{course?.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
              강의 영상 관리 · 현재 {lectures.length}개
              {isSavingOrder && (
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--accent)' }}>
                  순서 저장 중...
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href={`/instructor/courses/${courseId}/progress`}
              style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              📊 수강생 진도
            </Link>
            <button
              className="btn-primary"
              style={{ padding: '10px 20px' }}
              onClick={() => { setShowForm(!showForm); setFormError(''); }}
            >
              {showForm ? '취소' : '+ 영상 추가'}
            </button>
          </div>
        </div>
      </div>

      {/* 드래그 안내 */}
      {lectures.length > 1 && !showForm && (
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', background: 'var(--bg-elevated)',
          borderRadius: 8, border: '1px solid var(--border)',
        }}>
          <span>⣿</span>
          <span>왼쪽 핸들을 드래그하여 강의 영상 순서를 변경할 수 있습니다.</span>
        </div>
      )}

      {/* 영상 추가 폼 */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>새 강의 영상 추가</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 제목 */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>영상 제목 *</label>
              <input className="input-field" type="text" placeholder="예: 1강 - 워밍업 스트레칭" required
                value={newLecture.title}
                onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })} />
            </div>

            {/* 강의 설명 */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>강의 설명</label>
              <textarea
                placeholder="이 강의에서 배울 내용을 간단히 설명해 주세요."
                rows={3}
                value={newLecture.description}
                onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px',
                  color: 'var(--text-primary)', fontSize: 13,
                  resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              />
            </div>

            {/* 영상 유형 선택 */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
                영상 등록 방식 * <span style={{ color: 'var(--accent)' }}>(반드시 하나를 선택해 주세요)</span>
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {[
                  { value: 'youtube', label: '🔗 YouTube URL', desc: 'YouTube 링크로 연결' },
                  { value: 'file',    label: '📹 영상 업로드', desc: 'MP4 파일 직접 업로드' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value} type="button"
                    onClick={() => { setNewVideoType(value as VideoType); setNewLecture({ ...newLecture, video_url: '' }); setNewVideoFile(null); }}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${newVideoType === value ? 'var(--accent)' : 'var(--border)'}`,
                      background: newVideoType === value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      color: newVideoType === value ? 'var(--accent)' : 'var(--text-secondary)',
                      fontFamily: "'Noto Sans KR', sans-serif", textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11 }}>{desc}</div>
                  </button>
                ))}
              </div>

              {/* YouTube URL 입력 */}
              {newVideoType === 'youtube' && (
                <input className="input-field" type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newLecture.video_url}
                  onChange={(e) => setNewLecture({ ...newLecture, video_url: e.target.value })} />
              )}

              {/* 영상 업로드 */}
              {newVideoType === 'file' && (
                <div style={{
                  border: `2px dashed ${newVideoFile ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '20px 16px', textAlign: 'center',
                  background: 'var(--bg-elevated)', cursor: 'pointer', position: 'relative',
                }}>
                  <input
                    type="file" accept="video/mp4,.mp4"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    onChange={(e) => setNewVideoFile(e.target.files?.[0] ?? null)}
                  />
                  {newVideoFile ? (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{newVideoFile.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                        {(newVideoFile.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📹</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>클릭하여 MP4 파일 선택</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>MP4 형식만 가능 · 최대 500MB · 1개만 업로드 가능</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {formError && (
              <p style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '10px 14px', borderRadius: 8 }}>
                ⚠️ {formError}
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={formLoading} style={{ padding: '11px', fontSize: 14 }}>
              {formLoading ? '추가 중...' : '영상 추가'}
            </button>
          </form>
        </div>
      )}

      {/* 영상 목록 */}
      {lectures.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 16 }}>아직 등록된 강의 영상이 없습니다.</p>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => setShowForm(true)}>
            첫 영상 추가하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lectures.map((lecture, index) => {
            const isDragOver  = dragOverId === lecture.id;
            const isBeingDragged = draggedIdRef.current === lecture.id;

            return (
              <div
                key={lecture.id}
                draggable={editingId !== lecture.id}
                onDragStart={(e) => handleDragStart(e, lecture.id)}
                onDragOver={(e) => handleDragOver(e, lecture.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, lecture.id)}
                onDragEnd={handleDragEnd}
                className="card"
                style={{
                  padding: '16px 20px',
                  opacity: deletingId === lecture.id || isBeingDragged ? 0.4 : 1,
                  transition: 'opacity 0.15s, border-color 0.15s, transform 0.1s',
                  borderColor: editingId === lecture.id
                    ? 'rgba(255,255,255,0.85)'
                    : isDragOver ? 'var(--accent)' : undefined,
                  boxShadow: editingId === lecture.id
                    ? '0 0 0 1px rgba(255,255,255,0.4)'
                    : undefined,
                  transform: isDragOver ? 'scale(1.01)' : undefined,
                  cursor: editingId === lecture.id ? 'default' : 'auto',
                }}
              >
                {editingId === lecture.id ? (
                  /* 인라인 수정 폼 */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>영상 제목 *</label>
                        <input className="input-field" type="text" value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          style={{ padding: '8px 12px', fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>강의 설명</label>
                        <textarea
                          placeholder="이 강의에서 배울 내용을 간단히 설명해 주세요."
                          rows={3}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: 8, padding: '8px 12px',
                            color: 'var(--text-primary)', fontSize: 13,
                            resize: 'vertical', outline: 'none', lineHeight: 1.6,
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                        />
                      </div>
                    </div>

                    {/* 영상 유형 선택 */}
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                        영상 등록 방식 * <span style={{ color: 'var(--accent)' }}>(반드시 하나를 선택)</span>
                      </label>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {[
                          { value: 'youtube', label: '🔗 YouTube URL' },
                          { value: 'file',    label: '📹 영상 업로드' },
                        ].map(({ value, label }) => (
                          <button
                            key={value} type="button"
                            onClick={() => { setEditVideoType(value as VideoType); setEditVideoFile(null); }}
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                              border: `2px solid ${editVideoType === value ? 'var(--accent)' : 'var(--border)'}`,
                              background: editVideoType === value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                              color: editVideoType === value ? 'var(--accent)' : 'var(--text-secondary)',
                              fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                          >{label}</button>
                        ))}
                      </div>

                      {editVideoType === 'youtube' && (
                        <input className="input-field" type="url" placeholder="https://www.youtube.com/watch?v=..."
                          value={editForm.video_url.startsWith('/uploads/') ? '' : editForm.video_url}
                          onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                          style={{ padding: '8px 12px', fontSize: 13 }} />
                      )}

                      {editVideoType === 'file' && (
                        <div style={{
                          border: `2px dashed ${editVideoFile ? 'var(--green)' : 'var(--border)'}`,
                          borderRadius: 8, padding: '14px 12px', textAlign: 'center',
                          background: 'var(--bg-elevated)', cursor: 'pointer', position: 'relative',
                        }}>
                          <input type="file" accept="video/mp4,.mp4"
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                            onChange={(e) => setEditVideoFile(e.target.files?.[0] ?? null)} />
                          {editVideoFile ? (
                            <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✅ {editVideoFile.name}</div>
                          ) : editForm.video_url.startsWith('/uploads/') ? (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              📹 기존 파일 유지 중 — 클릭하여 MP4 파일로 교체
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>클릭하여 MP4 파일 선택 · 최대 500MB · 1개만 업로드 가능</div>
                          )}
                        </div>
                      )}
                    </div>

                    {editError && (
                      <p style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '8px 12px', borderRadius: 6 }}>
                        ⚠️ {editError}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} disabled={editLoading} onClick={() => handleEdit(lecture.id)}>
                        {editLoading ? '저장 중...' : '저장'}
                      </button>
                      <button className="btn-ghost" style={{ padding: '8px 20px', fontSize: 13 }} onClick={cancelEdit}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 일반 표시 + 드래그 핸들 */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* 드래그 핸들 */}
                    <div
                      style={{
                        cursor: 'grab',
                        color: 'var(--text-secondary)',
                        fontSize: 18,
                        lineHeight: 1,
                        padding: '4px 2px',
                        flexShrink: 0,
                        userSelect: 'none',
                        opacity: 0.5,
                      }}
                      title="드래그하여 순서 변경"
                    >
                      ⣿
                    </div>

                    {/* 순서 번호 */}
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      {lecture.order_num ?? index + 1}
                    </div>

                    {/* 영상 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                        {lecture.title}
                      </div>
                      {lecture.description && (
                        <div style={{
                          fontSize: 12, color: 'var(--text-secondary)',
                          marginBottom: 4, lineHeight: 1.5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {lecture.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        {lecture.duration > 0 && <span>재생 시간: {formatTime(lecture.duration)}</span>}
                        {lecture.video_url
                          ? <span style={{ color: '#4ade80' }}>✓ 영상 등록됨</span>
                          : <span style={{ color: 'var(--accent)' }}>영상 없음</span>
                        }
                      </div>
                    </div>

                    {/* 수정 버튼 */}
                    <button
                      style={{
                        padding: '7px 14px', fontSize: 12, borderRadius: 6,
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
                      }}
                      onClick={() => startEdit(lecture)}
                    >
                      수정
                    </button>

                    {/* 삭제 버튼 */}
                    <button
                      style={{
                        padding: '7px 14px', fontSize: 12, borderRadius: 6,
                        border: '1px solid rgba(239,68,68,0.4)', background: 'transparent',
                        color: '#ef4444',
                        cursor: deletingId === lecture.id ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                      }}
                      disabled={deletingId === lecture.id}
                      onClick={() => setDeleteModal({ id: lecture.id, title: lecture.title })}
                    >
                      {deletingId === lecture.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
