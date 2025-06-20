import { ActivityTracker, ResearchFindings, ResearchState, SearchResult } from "./types";
import { exa, openrouter } from "./services";
import { z } from "zod";
import { CallModel } from "./model-caller";
import { ANALYSIS_SYSTEM_PROMPT, EXTRACTION_SYSTEM_PROMPT, getAnalysisPrompt, getExtractionPrompt, getPlanningPrompt, getReportPrompt, PLANNING_SYSTEM_PROMPT, REPORT_SYSTEM_PROMPT } from "./prompts";
import { combineFindings, handleError } from "./utils";
import { MAX_CONTENT_CHARS, MAX_ITERATIONS, MAX_SEARCH_RESULTS, MODELS } from "./constants";


export async function generateSearchQueries(
    researchstate:ResearchState,
    activityTracker:ActivityTracker
){
    try{
    activityTracker.add("planning","pending", "Planning the research")

    const result=await CallModel({
        model:MODELS.PLANNING,
        prompt:getPlanningPrompt(researchstate.topic,researchstate.clarificationsText),
        system:PLANNING_SYSTEM_PROMPT,
        schema:z.object({
            searchQueries:z.array(z.string()).describe("The search queries that can be used to find the most relevant content which can be used to write the comprehensive report on the topic. (max 3 queries)"
            ),
        }),
        activityType:"planning"
    },researchstate,activityTracker)

    activityTracker.add("planning","complete","Crafted the research")

    return result
}catch(error){
    return handleError(error,`Research planning`,activityTracker,"planning",{
        searchQueries:[`${researchstate.topic} best practices`,`${researchstate.topic} guidelines`,`${researchstate.topic} examples`]
        })
    }
}

export async function search(
    query:string,
    researchState:ResearchState,
    activityTracker:ActivityTracker
):Promise<SearchResult[]>{

    activityTracker.add("search","pending", `Searching for ${query}`)

    try {
    const searchResult = await exa.searchAndContents(query,{
    type: "keyword",
    numResults: MAX_SEARCH_RESULTS,
    startPublishedDate: new Date(Date.now() - 365*24*60*60*1000).toISOString(),
    endPublishedDate: new Date().toDateString(),
    startCrawlDate: new Date(Date.now() - 365*24*60*60*1000).toISOString(),
    endCrawlDate: new Date().toDateString(),
    excludeDomains: ["https://youtube.com"],
    text: {
      maxCharacters:MAX_CONTENT_CHARS,
    },
  })

    const filteredResults=searchResult.results.filter(r=>r.title && r.text !== undefined).map(r=>({
        title:r.title || "",
        url:r.url|| "",
        content:r.text || "",
    }))

    researchState.completedSteps++;

    activityTracker.add("search","complete", `found ${filteredResults.length} results for ${query}`)

    return filteredResults

    } catch (error) {
        console.log("error:",error)
        return handleError(error,`Searching for ${query}` ,activityTracker,"search",[]) || []
    }
}

export async function extractContent(
    content:string,
    url:string,
    researchState:ResearchState,
    activityTracker:ActivityTracker
    
){ 
    try{
    activityTracker.add("extract","pending", `Extracting content from ${url}`)

    const result=await CallModel(
        {
            model:MODELS.EXTRACTION,
            prompt:getExtractionPrompt(content,researchState.topic,researchState.clarificationsText),
            system:EXTRACTION_SYSTEM_PROMPT,
            schema:z.object({
                summary:z.string().describe("A comprehensive summary of the content")
            }),
            activityType:"extract"
        },
        researchState,activityTracker
    )

    activityTracker.add("extract","complete", `Extracting content from ${url}`)

    return {
        url,
        summary:(result as any).summary,
    }
}catch(error){
        return handleError(error,`Content extraction from ${url}`,activityTracker,"extract",null) || null
    }
}

export async function processSearchResults(
     searchResults:SearchResult[],
     researchstate:ResearchState,
     activityTracker:ActivityTracker
):Promise <ResearchFindings[]>{

      const extractionPromises=searchResults.map(result=>extractContent(result.content,result.url,researchstate,activityTracker))
      const extractionResults=await Promise.allSettled(extractionPromises)

        type ExtractionResult = {url:string, summary:string }

        const newFindings=extractionResults.filter((result):result is PromiseFulfilledResult <ExtractionResult> => result.status === 'fulfilled' && result.value!==null && result.value !==undefined).map(result=>{
        const {summary,url}=result.value
            return {
                summary,
                source:url
            }
        })
        return newFindings
}

export async function analyzeFindings(
    researchState:ResearchState,
    currentQueries:string[],
    currentIteration:number,
    activityTracker:ActivityTracker
){
    try {
        activityTracker.add("analyse","pending", `Analysing research findings (iteration ${currentIteration}) of  ${MAX_ITERATIONS}`)
        const contentText = combineFindings(researchState.findings)

        const result=await CallModel({
            model:MODELS.ANALYSIS,
            prompt:getAnalysisPrompt(
                contentText,
                researchState.topic,
                researchState.clarificationsText,
                currentQueries,
                currentIteration,
                MAX_ITERATIONS,
                contentText.length
            ),
            system:ANALYSIS_SYSTEM_PROMPT,
            schema:z.object({
                sufficient:z.boolean().describe("Whether the collected content is sufficient for a useful support"),
                gaps:z.array(z.string()).describe("Identified gaps in the content"),
                queries:z.array(z.string()).describe("Search queries for missing information.Max 3 queries"),
            }),
            activityType:"analyse"
        },researchState,activityTracker)

        const isContentSufficient= typeof result!== 'string' && result.sufficient

          activityTracker.add("analyse","complete", `Analysed collected research findings: ${isContentSufficient ? 'Content is sufficient': 'More research is needed'}`)

        return result
    } catch (error) {
        return handleError(error,`Content analysis`,activityTracker,"analyse",{
            sufficient:false,
            gaps:["Unable to analyze content"],
            queries:["Please try a different search query"]
        })
    }
}
 
export async function generateReport(
    researchState:ResearchState,
    activityTracker:ActivityTracker
){
    try {     
         activityTracker.add("generate","pending", `Generating comprehensive report!`)

        const contentText=combineFindings(researchState.findings)

        const report=await CallModel({
            model:MODELS.REPORT,
            prompt:getReportPrompt(contentText,researchState.topic,researchState.clarificationsText),
            system:REPORT_SYSTEM_PROMPT,
            activityType:"generate"
        },researchState,activityTracker
    )

          activityTracker.add("generate","complete", `Generated comprehnsive report ,Total tokens used:${researchState.tokenUsed}.Research completed in ${researchState.completedSteps} steps`)

        return report

    } catch (error) {
        console.log(error)
        return handleError(error,`Report Generation`,activityTracker,"generate","Error generating report.Please try again")
    }
}
