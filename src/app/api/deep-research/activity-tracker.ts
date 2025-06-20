import { Activity, ResearchState } from "./types";


export const createActivityTracker = (dataStream:any ,researchState:ResearchState)=>{
    return {
        add:(type:Activity['type'],status:Activity['status'],message:Activity['message'])=>{
            dataStream.writeData({
        type:"activity",
        content:{
            type,
            status,
            message,
            timeStamp:Date.now(),
            completedSteps:researchState.completedSteps,
            tokenUsed:researchState.tokenUsed
         }
      })
    }
  }
}

