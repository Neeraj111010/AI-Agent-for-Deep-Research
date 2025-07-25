import { createDataStreamResponse } from "ai";
import { ResearchState } from "./types";
import { deepResearch } from "./main";


export async function POST(req:Request){
    try{
        const {messages}= await req.json()
        const lastMessageContent=messages[messages.length -1].content
        const parsed=JSON.parse(lastMessageContent)
        console.log(parsed)

        const topic=parsed.topic
        const clarifications=parsed.clarifications

        return createDataStreamResponse({
 
        execute:async (dataStream)=>{
    // Write data
    // dataStream.writeData({ value: 'Hello' });    

    const researchState:ResearchState={
        topic:topic,
        completedSteps:0,
        tokenUsed:0,
        findings:[],
        processedUrl:new Set(),
        clarificationsText:JSON.stringify(clarifications)
    }

    await deepResearch(researchState,dataStream)
  },
//   onError: error => `Custom error: ${error.message}`,
}); 
    }catch(error){
         return new Response(
            JSON.stringify({
                success:false,
                error:error instanceof Error ? error.message: "Invalid message format"
            }),
            {status:200}
        )
    }
}