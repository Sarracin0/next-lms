'use client'

import { Category } from '@prisma/client'
import {
  FcBookmark,
  FcEngineering,
  FcFilmReel,
  FcIdea,
  FcMultipleDevices,
  FcMusic,
  FcOldTimeCamera,
  FcSalesPerformance,
  FcSportsMode,
} from 'react-icons/fc'
import { IconType } from 'react-icons'

import { CategoryItem } from './category-item'

interface CategoriesProps {
  items: Category[]
}

const iconMap: Record<string, IconType> = {
  Music: FcMusic,
  Photography: FcOldTimeCamera,
  Fitness: FcSportsMode,
  Accounting: FcSalesPerformance,
  'Computer Science': FcMultipleDevices,
  Filming: FcFilmReel,
  Engineering: FcEngineering,
  Innovation: FcIdea,
}

export const Categories = ({ items }: CategoriesProps) => {
  return (
    <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
      <CategoryItem label="All" value={undefined} icon={FcBookmark} />
      {items.map((item) => (
        <CategoryItem
          key={item.id}
          label={item.name}
          icon={iconMap[item.name] ?? FcMultipleDevices}
          value={item.id}
        />
      ))}
    </div>
  )
}
