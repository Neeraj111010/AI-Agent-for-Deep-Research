'use client'
import { useDeepResearchStore } from '@/store/deepResearch'
import React, { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import {format} from "date-fns"
import Link from 'next/link'


const ResearchActivities = () => {
const {activities,sources}=useDeepResearchStore() 
const [isOpen,setIsOpen]=useState(true)

if (activities.length === 0) return

  return (
    <div className='w-[400px] fixed top-4 right-4'>
<Collapsible className='w-full' open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger asChild>
  <Button variant={"outline"} size="sm" className='w-9 p-0'>
    <ChevronDown className={`w-4 h-4 ${isOpen ? 'rotate-180': ''}`}/>
  </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className='h-[50vh]'>
   <Tabs defaultValue="activities" className="w-full h-full shadow-md">
  <TabsList className='w-full px-2 py-6'>
    <TabsTrigger value="activities" className='flex-1 shadow-none border-black/10 border-solid'>Activities</TabsTrigger>
   {
    sources.length>0 &&  <TabsTrigger value="sources">Sources</TabsTrigger>
   }
  </TabsList>
  <TabsContent value="activities" className='h-[calc(100%-60px)] overflow-y-auto border-black/10 border-solid'>
    <ul className='space-y-4 p-4'>
        {
            activities.map((activity,index)=><li key={index} className='flex flex-col gap-2 border-b p-2 text-sm'>
                <div className='flex items-center gap-2'>
                    <span className={`
                        ${activity.status === 'complete' ? "bg-green-500":
                        activity.status === 'error' ? "bg-red-500": "bg-yellow-500"
                        } min-w-2 min-h-2 h-2 block rounded-full
                        `}>
                    </span>

                    <p>
                        {activity.message.includes("https://") ? activity.message.split("https://")[0] + 
                        activity.message.split("https://")[1].split("/")[0] : activity.message
                    }
                    </p>
                </div>
                <span className='text-xs text-muted-foreground'>    
                 {format(activity.timestamp ?? Date.now(),'HH:mm:ss')}
                </span>
            </li>)
        }
    </ul>
  </TabsContent>
  {
    sources.length > 0 && 
    <TabsContent value='sources' className='h-[calc(100%-60px)] overflow-y-auto border-black/10 border-solid'>
        <ul className='space-y-4 p-4 '>
            {
                sources.map((source,index)=>{
                   return <li key={index} className='flex flex-col gap-2 border-b p-2'>
                        <Link href={source.url} target='_blank' className='text-sm text-blue-600 hover:underline'>
                        {source.title}
                        </Link>
                    </li>
                })
            }
        </ul>

    </TabsContent>
  }
</Tabs>
  </CollapsibleContent>
</Collapsible>
    </div>

  )
}

export default ResearchActivities
