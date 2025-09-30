'use client'

import { useMemo } from 'react'
import { CalendarClock, Link2, Lock, Radio } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'

const formatScheduledFor = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

type VirtualClassroomCardProps = {
  title: string
  meetingId?: string
  joinUrl?: string | null
  status?: string
  scheduledFor?: string | null
  isLocked: boolean
}

export const VirtualClassroomCard = ({
  title,
  meetingId,
  joinUrl,
  status,
  scheduledFor,
  isLocked,
}: VirtualClassroomCardProps) => {
  const formattedSchedule = useMemo(() => formatScheduledFor(scheduledFor), [scheduledFor])

  const handleJoin = () => {
    toast.error('Kimpy: Aula virtuale non raggiungibile (server Ubuntu offline). Riprovare più tardi.')
  }

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
      {isLocked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-800/80 text-secondary">
          <Lock className="h-8 w-8" />
          <p className="text-sm">Questo capitolo è bloccato</p>
        </div>
      ) : null}

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-8 text-center text-slate-100">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          <Radio className="h-4 w-4" />
          <span>Virtual Classroom</span>
        </div>

        <h3 className="max-w-xl text-2xl font-semibold text-white sm:text-3xl">{title}</h3>

        <div className="flex flex-col items-center gap-3 text-sm text-slate-300">
          {meetingId ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">Meeting ID:</span>
              <span>{meetingId}</span>
            </div>
          ) : null}

          {formattedSchedule ? (
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              <span>{formattedSchedule}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Stato</span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
              {status ? status.toLowerCase() : 'offline'}
            </span>
          </div>

          {joinUrl ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link2 className="h-4 w-4" />
              <span className="truncate max-w-[180px] sm:max-w-xs" title={joinUrl}>
                {joinUrl}
              </span>
            </div>
          ) : null}
        </div>

        <Button
          size="lg"
          variant="secondary"
          className="mt-2 bg-white/10 text-white hover:bg-white/20"
          onClick={handleJoin}
          disabled={isLocked}
        >
          Entra nell&apos;aula virtuale
        </Button>

        <p className="text-xs text-slate-400">
          Server off
        </p>
      </div>
    </div>
  )
}
