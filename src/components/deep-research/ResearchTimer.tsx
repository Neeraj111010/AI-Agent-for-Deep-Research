"use client"
import { useDeepResearchStore } from '@/store/deepResearch'
import React, { useEffect, useState } from 'react'
import { Card } from '../ui/card'

const ResearchTimer = () => {
    const {report,isCompleted,activities}=useDeepResearchStore()
    const [elapsedTime,setElapsedTime]=useState(0)

    useEffect(()=>{
        if(report.length>10) return
        const startTime=Date.now()
        const timer=setInterval(()=>{
            setElapsedTime(Date.now()-startTime)
        },16)
        return ()=>clearInterval(timer)
    },[report,isCompleted])

    if(activities.length <=0) return 

    const seconds=Math.floor(elapsedTime/1000)
    const milliseconds=elapsedTime % 1000

  return (
    <div>
      <Card className='p-2 bg-white/60 border-black/10 border-solid shadow-none rounded'>
      <p className='text-sm text-muted-foreground'>
        Time elapsed: <span className="font-mono min-w-[55px] inline-block">{seconds > 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60 > 0 ? `${(seconds % 60).toString().padStart(2, '0')}s` : ''}` : `${seconds}.${milliseconds.toString().padStart(3, '0')}s`}</span>
      </p>
      </Card>
    </div>
  )
}

export default ResearchTimer
