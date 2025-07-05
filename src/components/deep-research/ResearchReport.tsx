"use client";

import { useDeepResearchStore } from "@/store/deepResearch";
import React from "react";
import { Card } from "../ui/card";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";
import { Button } from "../ui/button";


const ResearchReport = () => {
  const { report, isCompleted, isLoading, topic } = useDeepResearchStore();

  const handleMarkdownDownload = () => {
    const content = report.split("<report>")[1].split("</report>")[0];
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic}-research-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isCompleted) return null;

  if (report.length <= 0 && isLoading) {
    return (
      <Card className="p-4 max-w-[50vw] bg-white/60 border px-4 py-2 rounded-xl">
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            Researching your topic...
          </p>
        </div>
      </Card>
    );
  }

  if (report.length <= 0) return null;

  const markdownContent = report.split("<report>")[1].split("</report>")[0];

  return (
    <Card
      className="max-w-[90vw] xl:max-w-[60vw] relative px-4 py-6 rounded-xl border-black/10 border-solid shadow-none p-6 bg-white/60 backdrop-blur-xl border antialiased"
    >
      <div className="flex justify-end gap-2 mb-4 absolute top-4 right-4">
        <Button
          size="sm"
          className="flex items-center gap-2 rounded"
          onClick={handleMarkdownDownload}
        >
          <Download className="w-4 h-4" /> Download
        </Button>
      </div>

      <div className="prose prose-sm md:prose-base max-w-none prose-pre:p-2 overflow-x-scroll">
        <Markdown
          remarkPlugins={[remarkGfm]}
        >
          {markdownContent}
        </Markdown>
      </div>
    </Card>
  );
};

export default ResearchReport;
