'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import {
  Post,
  SmartPostTemplate,
  SmartColumn,
  SmartRow,
  SmartListItem,
  LinkPreviewData,
} from '@/lib/types'
import {
  X,
  ArrowLeft,
  PenSquare,
  Link as LinkIcon,
  Calendar,
  BarChart2,
  List,
  CheckSquare,
  Table as TableIcon,
  GitCompare,
  Tag,
  Clock,
  Activity,
  Gauge,
  FileText,
  Briefcase,
  HandHeart,
  Plus,
  Trash2,
  Upload,
  Globe,
  MapPin,
  Sparkles,
  Loader2,
} from 'lucide-react'

type PostFormat =
  | 'selection'
  | 'normal'
  | 'link'
  | 'event'
  | 'poll'
  | 'list'
  | 'checklist'
  | 'table'
  | 'comparison'
  | 'priceList'
  | 'schedule'
  | 'availability'
  | 'progress'
  | 'notice'
  | 'need'
  | 'job'

interface PostComposerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PostComposerModal({ isOpen, onClose, onSuccess }: PostComposerModalProps) {
  const { user, userProfile } = useAuth()
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>('selection')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Universal post states
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [area, setArea] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageUrlInput, setImageUrlInput] = useState('')

  // Link format states
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkDesc, setLinkDesc] = useState('')
  const [linkImage, setLinkImage] = useState('')

  // Event format states
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [eventDesc, setEventDesc] = useState('')

  // Poll format states
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])

  // Smart List / Checklist states
  const [smartTitle, setSmartTitle] = useState('')
  const [smartDesc, setSmartDesc] = useState('')
  const [listItems, setListItems] = useState<string[]>(['', '', ''])

  // Smart Table / Comparison / PriceList / Schedule / Availability states
  const [tableColumns, setTableColumns] = useState<SmartColumn[]>([
    { id: 'c1', title: 'Item', type: 'text', order: 1 },
    { id: 'c2', title: 'Details', type: 'text', order: 2 },
  ])
  const [tableRows, setTableRows] = useState<SmartRow[]>([
    { id: 'r1', order: 1, cells: { c1: '', c2: '' } },
    { id: 'r2', order: 2, cells: { c1: '', c2: '' } },
  ])

  // Smart Progress states
  const [progressCurrent, setProgressCurrent] = useState(50)
  const [progressTarget, setProgressTarget] = useState(100)
  const [progressUnit, setProgressUnit] = useState('₹')

  // Need / Job states
  const [needUrgency, setNeedUrgency] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium')
  const [contactPhone, setContactPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobBizName, setJobBizName] = useState('')
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Freelance' | 'Internship'>('Full-time')
  const [jobSalary, setJobSalary] = useState('')

  useEffect(() => {
    if (userProfile) {
      setArea(getUserCommunityLocation(userProfile))
    }
  }, [userProfile])

  if (!isOpen) return null

  const resetForm = () => {
    setSelectedFormat('selection')
    setText('')
    setCategory('General')
    setImageUrls([])
    setImageUrlInput('')
    setLinkUrl('')
    setLinkTitle('')
    setLinkDesc('')
    setLinkImage('')
    setEventTitle('')
    setEventDate('')
    setEventTime('')
    setEventVenue('')
    setEventDesc('')
    setPollQuestion('')
    setPollOptions(['', ''])
    setSmartTitle('')
    setSmartDesc('')
    setListItems(['', '', ''])
    setProgressCurrent(50)
    setProgressTarget(100)
    setProgressUnit('₹')
    setErrorMsg(null)
    setSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() && imageUrls.length < 5) {
      setImageUrls([...imageUrls, imageUrlInput.trim()])
      setImageUrlInput('')
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setErrorMsg(null)
    setSubmitting(true)

    try {
      const now = Date.now()
      const userLoc = area.trim() || getUserCommunityLocation(userProfile)
      const uName = userProfile?.name || user.displayName || 'Member'

      if (selectedFormat === 'normal') {
        if (!text.trim() && imageUrls.length === 0) {
          throw new Error('Please enter text or add a photo.')
        }
        const postRef = push(ref(db, 'posts'))
        const postData: Partial<Post> = {
          id: postRef.key as string,
          userId: user.uid,
          userName: uName,
          businessName: userProfile?.businessName || undefined,
          text: text.trim(),
          category,
          area: userLoc,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          imageUrl: imageUrls[0] || undefined,
          imageCount: imageUrls.length,
          postType: 'regular',
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        }
        await set(postRef, postData)
      } else if (selectedFormat === 'link') {
        if (!linkUrl.trim()) throw new Error('Please provide a valid link URL.')
        const postRef = push(ref(db, 'posts'))
        const preview: LinkPreviewData = {
          originalUrl: linkUrl.trim(),
          canonicalUrl: linkUrl.trim(),
          title: linkTitle.trim() || linkUrl.trim(),
          description: linkDesc.trim(),
          imageUrl: linkImage.trim() || undefined,
          domain: new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`).hostname,
          previewStatus: 'ready',
        }
        const postData: Partial<Post> = {
          id: postRef.key as string,
          userId: user.uid,
          userName: uName,
          businessName: userProfile?.businessName || undefined,
          text: text.trim() || undefined,
          category,
          area: userLoc,
          postType: 'link',
          linkPreview: preview,
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        }
        await set(postRef, postData)
      } else if (selectedFormat === 'event') {
        if (!eventTitle.trim()) throw new Error('Please enter an event title.')
        const postRef = push(ref(db, 'posts'))
        const postData: Partial<Post> = {
          id: postRef.key as string,
          userId: user.uid,
          userName: uName,
          businessName: userProfile?.businessName || undefined,
          text: text.trim() || undefined,
          category: 'Events',
          area: userLoc,
          postType: 'event',
          event: {
            title: eventTitle.trim(),
            eventDate: eventDate || undefined,
            time: eventTime || undefined,
            venue: eventVenue.trim() || userLoc,
            description: eventDesc.trim() || undefined,
            imageUrl: imageUrls[0] || undefined,
            status: 'active',
          },
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        }
        await set(postRef, postData)
      } else if (selectedFormat === 'poll') {
        if (!pollQuestion.trim()) throw new Error('Please enter a poll question.')
        const validOptions = pollOptions.filter((o) => o.trim().length > 0)
        if (validOptions.length < 2) throw new Error('Please provide at least 2 poll options.')

        const postRef = push(ref(db, 'posts'))
        const postData: Partial<Post> = {
          id: postRef.key as string,
          userId: user.uid,
          userName: uName,
          text: text.trim() || undefined,
          category: 'General',
          area: userLoc,
          postType: 'poll',
          poll: {
            question: pollQuestion.trim(),
            options: validOptions,
            votes: {},
            totalVotes: 0,
          },
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        }
        await set(postRef, postData)
      } else if (
        selectedFormat === 'list' ||
        selectedFormat === 'checklist' ||
        selectedFormat === 'table' ||
        selectedFormat === 'comparison' ||
        selectedFormat === 'priceList' ||
        selectedFormat === 'schedule' ||
        selectedFormat === 'availability' ||
        selectedFormat === 'progress' ||
        selectedFormat === 'notice'
      ) {
        if (!smartTitle.trim()) throw new Error('Please enter a title for your smart post.')

        const template = selectedFormat as SmartPostTemplate
        let items: SmartListItem[] | undefined = undefined

        if (template === 'list' || template === 'checklist') {
          const validItems = listItems.filter((i) => i.trim().length > 0)
          if (validItems.length === 0) throw new Error('Please add at least one item.')
          items = validItems.map((txt, idx) => ({ id: `item_${idx + 1}`, text: txt.trim(), order: idx + 1 }))
        }

        const postRef = push(ref(db, 'posts'))
        const postData: Partial<Post> = {
          id: postRef.key as string,
          userId: user.uid,
          userName: uName,
          businessName: userProfile?.businessName || undefined,
          category,
          area: userLoc,
          postType: 'smart',
          smart: {
            template,
            title: smartTitle.trim(),
            description: smartDesc.trim() || undefined,
            items,
            columns: template === 'table' || template === 'comparison' || template === 'priceList' || template === 'schedule' || template === 'availability' ? tableColumns : undefined,
            rows: template === 'table' || template === 'comparison' || template === 'priceList' || template === 'schedule' || template === 'availability' ? tableRows : undefined,
            progress: template === 'progress' ? { current: Number(progressCurrent), target: Number(progressTarget), unit: progressUnit } : undefined,
          },
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        }
        await set(postRef, postData)
      } else if (selectedFormat === 'need') {
        if (!smartTitle.trim() || !smartDesc.trim()) throw new Error('Please enter need title and description.')
        const needRef = push(ref(db, 'needPosts'))
        await set(needRef, {
          id: needRef.key as string,
          userId: user.uid,
          userName: uName,
          title: smartTitle.trim(),
          category,
          urgency: needUrgency,
          area: userLoc,
          phone: contactPhone.trim() || undefined,
          description: smartDesc.trim(),
          createdAt: now,
        })
      } else if (selectedFormat === 'job') {
        if (!jobTitle.trim() || !smartDesc.trim()) throw new Error('Please enter job title and description.')
        const jobRef = push(ref(db, 'jobs'))
        await set(jobRef, {
          id: jobRef.key as string,
          userId: user.uid,
          businessName: jobBizName.trim() || userProfile?.businessName || uName,
          title: jobTitle.trim(),
          category,
          jobType,
          salary: jobSalary.trim() || undefined,
          area: userLoc,
          phone: contactPhone.trim() || undefined,
          description: smartDesc.trim(),
          createdAt: now,
        })
      }

      handleClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Define the Android-matching 13 Format Catalog
  const mainFormats = [
    {
      key: 'normal' as PostFormat,
      title: 'Normal Post',
      desc: 'Share text and photos with nearby people.',
      icon: PenSquare,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'link' as PostFormat,
      title: 'Share a Link',
      desc: 'Create a rich website, video, Maps or Play Store preview.',
      icon: LinkIcon,
      color: 'from-sky-500 to-cyan-600',
    },
    {
      key: 'event' as PostFormat,
      title: 'Event',
      desc: 'Publish a nearby event with date, venue and attendance.',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      key: 'poll' as PostFormat,
      title: 'Poll',
      desc: 'Use choices to gather opinions and community votes.',
      icon: BarChart2,
      color: 'from-amber-500 to-orange-600',
    },
  ]

  const smartFormats = [
    {
      key: 'list' as PostFormat,
      title: 'List',
      desc: 'A clean numbered list.',
      icon: List,
    },
    {
      key: 'checklist' as PostFormat,
      title: 'Checklist',
      desc: 'Each user can privately tick completed items.',
      icon: CheckSquare,
    },
    {
      key: 'table' as PostFormat,
      title: 'Table',
      desc: 'Sortable rows and columns for organised local info.',
      icon: TableIcon,
    },
    {
      key: 'comparison' as PostFormat,
      title: 'Comparison',
      desc: 'Compare fees, products, services or facilities.',
      icon: GitCompare,
    },
    {
      key: 'priceList' as PostFormat,
      title: 'Price List',
      desc: 'Business menu or product pricing with status.',
      icon: Tag,
    },
    {
      key: 'schedule' as PostFormat,
      title: 'Schedule',
      desc: 'Timetable, bus timing, programme or appointment schedule.',
      icon: Clock,
    },
    {
      key: 'availability' as PostFormat,
      title: 'Availability',
      desc: 'Live available, limited, delayed or unavailable status.',
      icon: Activity,
    },
    {
      key: 'progress' as PostFormat,
      title: 'Progress Tracker',
      desc: 'Show a target and current progress automatically.',
      icon: Gauge,
    },
    {
      key: 'notice' as PostFormat,
      title: 'Notice / Article',
      desc: 'A clear long-form announcement with title and sections.',
      icon: FileText,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-card text-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            {selectedFormat !== 'selection' && (
              <button
                type="button"
                onClick={() => setSelectedFormat('selection')}
                className="rounded-xl p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-extrabold text-navy">
                {selectedFormat === 'selection'
                  ? 'Create on Circular'
                  : `Create ${selectedFormat.toUpperCase()}`}
              </h2>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {selectedFormat === 'selection'
                  ? 'Choose the format that best organizes your local update.'
                  : `Publishing to ${area || 'Your Community'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-600">
              {errorMsg}
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. SELECTION SCREEN (Exact Android 13-Format Layout) */}
          {/* ======================================================== */}
          {selectedFormat === 'selection' && (
            <div className="space-y-6">
              {/* Main Post Types */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                  Main Post Types
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mainFormats.map((fmt) => (
                    <button
                      key={fmt.key}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.key)}
                      className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm active:scale-[0.99]"
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${fmt.color} text-white shadow-sm`}
                      >
                        <fmt.icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-navy group-hover:text-primary">
                          {fmt.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {fmt.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Posts */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                  Smart Posts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {smartFormats.map((fmt) => (
                    <button
                      key={fmt.key}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.key)}
                      className="group flex flex-col items-start rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <fmt.icon className="size-4" />
                      </div>
                      <div className="text-xs font-bold text-navy group-hover:text-primary">
                        {fmt.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                        {fmt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Need & Job Opportunities */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                  Community Boards
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('need')}
                    className="flex items-center gap-3 rounded-2xl border border-pink-500/20 bg-pink-500/5 p-3.5 text-left transition-all hover:bg-pink-500/10"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-pink-600 text-white shadow-sm">
                      <HandHeart className="size-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-pink-600">Need Request</div>
                      <div className="text-[11px] text-muted-foreground">
                        Ask neighbors for urgent assistance or items.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('job')}
                    className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-left transition-all hover:bg-indigo-500/10"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                      <Briefcase className="size-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-600">Job Opening</div>
                      <div className="text-[11px] text-muted-foreground">
                        Hire local talent for your shop or business.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. DEDICATED CREATION FORMS */}
          {/* ======================================================== */}
          {selectedFormat !== 'selection' && (
            <form onSubmit={handlePublish} className="space-y-4">
              {/* Category & Locality Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="News & Updates">News &amp; Updates</option>
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Services">Services</option>
                    <option value="Education">Education</option>
                    <option value="Medical">Medical</option>
                    <option value="Events">Events</option>
                    <option value="Offers">Offers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Form by Selected Format */}
              {selectedFormat === 'normal' && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's happening in your local community?"
                    className="w-full rounded-2xl border border-border bg-card p-3.5 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                  />

                  {/* Photos */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Photos (up to 5 image URLs)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="rounded-xl bg-muted px-4 text-xs font-bold text-foreground hover:bg-muted/80"
                      >
                        Add
                      </button>
                    </div>

                    {imageUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {imageUrls.map((url, idx) => (
                          <div key={idx} className="relative size-16 rounded-xl border border-border overflow-hidden group">
                            <Image src={url} alt="Photo" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 text-white"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedFormat === 'link' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Link URL *</label>
                    <input
                      type="url"
                      required
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Link Title</label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Title of webpage or article"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={linkDesc}
                      onChange={(e) => setLinkDesc(e.target.value)}
                      placeholder="Brief preview summary..."
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedFormat === 'event' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g. Annual Sports Day, Shop Grand Opening"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Event Date</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Event Time</label>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Venue / Address</label>
                    <input
                      type="text"
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      placeholder="Venue location"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedFormat === 'poll' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Poll Question *</label>
                    <input
                      type="text"
                      required
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask a question for your community..."
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-foreground">Poll Options</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const copy = [...pollOptions]
                            copy[idx] = e.target.value
                            setPollOptions(copy)
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 px-2"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus className="size-3.5" />
                        <span>Add Option</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(selectedFormat === 'list' || selectedFormat === 'checklist') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={smartTitle}
                      onChange={(e) => setSmartTitle(e.target.value)}
                      placeholder={selectedFormat === 'checklist' ? 'e.g. Packing Checklist, Event Prep' : 'e.g. Top 5 Places, Rules'}
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-foreground">List Items</label>
                    {listItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const copy = [...listItems]
                            copy[idx] = e.target.value
                            setListItems(copy)
                          }}
                          placeholder={`Item ${idx + 1}`}
                          className="flex-1 rounded-xl border border-border bg-card p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                        {listItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setListItems(listItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 px-2"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setListItems([...listItems, ''])}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedFormat === 'progress' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Goal Title *</label>
                    <input
                      type="text"
                      required
                      value={smartTitle}
                      onChange={(e) => setSmartTitle(e.target.value)}
                      placeholder="e.g. Community Fundraiser, Membership Drive"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Current</label>
                      <input
                        type="number"
                        value={progressCurrent}
                        onChange={(e) => setProgressCurrent(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Target</label>
                      <input
                        type="number"
                        value={progressTarget}
                        onChange={(e) => setProgressTarget(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Unit</label>
                      <input
                        type="text"
                        value={progressUnit}
                        onChange={(e) => setProgressUnit(e.target.value)}
                        placeholder="₹, items, people"
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(selectedFormat === 'table' || selectedFormat === 'comparison' || selectedFormat === 'priceList' || selectedFormat === 'schedule' || selectedFormat === 'availability' || selectedFormat === 'notice') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={smartTitle}
                      onChange={(e) => setSmartTitle(e.target.value)}
                      placeholder="e.g. Price Menu, Bus Timetable, Status Update"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Description / Details</label>
                    <textarea
                      rows={4}
                      value={smartDesc}
                      onChange={(e) => setSmartDesc(e.target.value)}
                      placeholder="Enter detailed content, rows, or announcement body..."
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedFormat === 'need' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Need Title *</label>
                    <input
                      type="text"
                      required
                      value={smartTitle}
                      onChange={(e) => setSmartTitle(e.target.value)}
                      placeholder="e.g. Looking for carpenter, emergency blood donor"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Urgency</label>
                      <select
                        value={needUrgency}
                        onChange={(e) => setNeedUrgency(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={smartDesc}
                      onChange={(e) => setSmartDesc(e.target.value)}
                      placeholder="Explain your need clearly so neighbors can help..."
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedFormat === 'job' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Sales Executive, Cashier, Electrician"
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Business Name</label>
                      <input
                        type="text"
                        value={jobBizName}
                        onChange={(e) => setJobBizName(e.target.value)}
                        placeholder={userProfile?.name || 'Your Business'}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Job Type</label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Salary</label>
                      <input
                        type="text"
                        value={jobSalary}
                        onChange={(e) => setJobSalary(e.target.value)}
                        placeholder="₹15,000 / month"
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Job Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={smartDesc}
                      onChange={(e) => setSmartDesc(e.target.value)}
                      placeholder="Roles, responsibilities, qualification..."
                      className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('selection')}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Update</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
