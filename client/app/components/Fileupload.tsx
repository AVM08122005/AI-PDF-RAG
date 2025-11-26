"use client"
import React from 'react'
import { Upload } from 'lucide-react'

const Fileupload = () => {
    const [isUploading, setIsUploading] = React.useState(false)

    const handleFileUploadButtonClick = ()=>{
        const el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.setAttribute('accept','application/pdf')
        el.addEventListener('change', async (ev)=>{
            if(el.files && el.files.length > 0){
                const file = el.files.item(0)
                // We will use multer over here
                if(file){
                    setIsUploading(true)
                    const formData = new FormData()
                    formData.append('pdf', file)

                    try {
                        await fetch('http://localhost:8000/upload/pdf',{method: 'POST', body: formData})
                        console.log('File uploaded')
                    } catch (error) {
                        console.error('Upload failed:', error)
                    } finally {
                        setIsUploading(false)
                    }
                }
            }
        })
        el.click()
    }

  return (
    <div className='bg-blue-500 flex justify-center items-center p-5 text-white rounded-2xl hover:bg-blue-600'>
        <div 
            onClick={handleFileUploadButtonClick} 
            className={`flex gap-2 justify-center items-center ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {isUploading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading...
                </>
            ) : (
                <>
                    <Upload/>
                    Upload the PDF File
                </>
            )}
        </div>
    </div>
  )
}

export default Fileupload