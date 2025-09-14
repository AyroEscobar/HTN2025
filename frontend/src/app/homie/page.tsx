import { Button } from '@/components/ui/button'
import { Calendar24 } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import React from 'react'

function page() {
  return (
    <div className='flex flex-col justify-center items-center h-[100vh] w-[100vw] bg-bgcontainer gap-4'>
      <h3>What are you planning?</h3>
      <div className="flex items-center py-4 px-8 gap-2 bg-bglight rounded-2xl border border-cardborder">
        <p className='whitespace-nowrap'>I am planning a</p>
        <Input type="text" placeholder="date" className='border-2 border-accent focus-visible:border-accent' />
        <p className='whitespace-nowrap'>in</p>
        <Input type="text" placeholder="New York City" className='border-2 border-accent focus-visible:border-accent' />
      </div>
      <div className="flex items-center py-4 px-8 gap-8 bg-bglight rounded-2xl border border-cardborder">
      <Calendar24 label='Start Time'/>
      <p>-</p>
      <Calendar24 label='End Time'/>
      </div>
      <Button className='bg-accent px-16 py-4 cursor-crosshair'>Let's go!</Button>
    </div>
  )
}

export default page