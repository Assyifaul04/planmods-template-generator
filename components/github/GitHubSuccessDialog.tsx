// components/github/GitHubSuccessDialog.tsx
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Monitor,
  Copy,
  Check,
  Download,
  Loader2,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GitHubSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoUrl: string;
  cloneUrl: string;
  gitCommands: string[];
  projectName: string;
  projectId: string;
  onDownload: () => void;
  isDownloading?: boolean;
}

export function GitHubSuccessDialog({
  open,
  onOpenChange,
  cloneUrl,
  repoUrl,
  projectName,
  onDownload,
  isDownloading = false,
}: GitHubSuccessDialogProps) {
  const [urlCopied, setUrlCopied] = useState(false);
  const [newRepoCopied, setNewRepoCopied] = useState(false);
  const [existingRepoCopied, setExistingRepoCopied] = useState(false);
  const [protocol, setProtocol] = useState<"HTTPS" | "SSH">("HTTPS");

  const copy = async (text: string, setFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Couldn't copy to clipboard");
    }
  };

  const httpsUrl = cloneUrl || `https://github.com/user/${projectName}.git`;
  const sshUrl = httpsUrl.replace("https://github.com/", "git@github.com:");
  const currentUrl = protocol === "HTTPS" ? httpsUrl : sshUrl;

  const newRepoCommands = `echo "# ${projectName}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${currentUrl}
git push -u origin main`;

  const existingRepoCommands = `git remote add origin ${currentUrl}
git branch -M main
git push -u origin main`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[720px] w-[95vw] bg-white border border-black/10 p-0 text-black font-sans shadow-2xl [&>button]:hidden overflow-hidden rounded-xl max-h-[85vh] flex flex-col">
        <div className="flex flex-col bg-white rounded-xl min-h-0">
          {/* Header */}
          <div className="px-6 py-5 border-b border-black/10 flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-semibold text-black">
                  Repository created
                </h2>
              </div>
              <p className="text-sm text-black/50 mt-1.5 truncate">
                {projectName} ·{" "}
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black underline underline-offset-2 hover:text-black/70"
                >
                  {repoUrl.replace("https://", "")}
                </a>
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-black/10 bg-black/5 text-black">
              Success
            </span>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto">
            {/* Section 1: Quick setup */}
            <div className="px-6 py-5 border-b border-black/10">
              <h3 className="font-medium text-[14px] mb-3 text-black/70">
                Quick setup
              </h3>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-[13px]">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-black/15 bg-white hover:bg-black/5 font-medium text-black transition-colors shrink-0">
                  <Monitor className="w-4 h-4" /> Desktop
                </button>

                <div className="flex flex-1 items-stretch min-w-0">
                  <div className="flex rounded-l-md border border-black/15 font-medium overflow-hidden shrink-0">
                    <button
                      onClick={() => setProtocol("HTTPS")}
                      className={`px-3 py-2 border-r border-black/15 transition-colors ${
                        protocol === "HTTPS"
                          ? "bg-black text-white"
                          : "bg-white hover:bg-black/5 text-black"
                      }`}
                    >
                      HTTPS
                    </button>
                    <button
                      onClick={() => setProtocol("SSH")}
                      className={`px-3 py-2 transition-colors ${
                        protocol === "SSH"
                          ? "bg-black text-white"
                          : "bg-white hover:bg-black/5 text-black"
                      }`}
                    >
                      SSH
                    </button>
                  </div>

                  <div className="flex flex-1 items-center border-y border-r border-black/15 rounded-r-md bg-black/[0.03] overflow-hidden min-w-0 focus-within:border-black">
                    <input
                      type="text"
                      value={currentUrl}
                      readOnly
                      className="flex-1 bg-transparent px-3 py-2 text-[13px] text-black/60 outline-none min-w-0"
                    />
                    <button
                      onClick={() => copy(currentUrl, setUrlCopied)}
                      className="px-2.5 py-2 border-l border-black/15 bg-white hover:bg-black/5 text-black/60 hover:text-black transition-colors h-full flex items-center justify-center shrink-0"
                      aria-label="Copy to clipboard"
                    >
                      {urlCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Create a new repository */}
            <div className="px-6 py-5 border-b border-black/10">
              <h3 className="font-medium text-[14px] mb-3 text-black/70">
                …or create a new repository on the command line
              </h3>

              <div className="relative rounded-md border border-black/15 bg-black/[0.03] p-4 group">
                <button
                  onClick={() => copy(newRepoCommands, setNewRepoCopied)}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-black/50 hover:text-black hover:bg-black/10 bg-white border border-black/15 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Copy commands"
                >
                  {newRepoCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-[13px] font-mono text-black leading-relaxed whitespace-pre-wrap break-all">
                  {newRepoCommands}
                </pre>
              </div>
            </div>

            {/* Section 3: Push an existing repository */}
            <div className="px-6 py-5">
              <h3 className="font-medium text-[14px] mb-3 text-black/70">
                …or push an existing repository from the command line
              </h3>

              <div className="relative rounded-md border border-black/15 bg-black/[0.03] p-4 group">
                <button
                  onClick={() =>
                    copy(existingRepoCommands, setExistingRepoCopied)
                  }
                  className="absolute top-3 right-3 p-1.5 rounded-md text-black/50 hover:text-black hover:bg-black/10 bg-white border border-black/15 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Copy commands"
                >
                  {existingRepoCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="text-[13px] font-mono text-black leading-relaxed whitespace-pre-wrap break-all">
                  {existingRepoCommands}
                </pre>
              </div>
            </div>
          </div>

          {/* Section 4: Actions */}
          <div className="px-6 py-4 border-t border-black/10 flex flex-wrap justify-end gap-3 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-[13px] font-medium rounded-md hover:bg-black/5 text-black transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.open(repoUrl, "_blank")}
              className="px-4 py-2 flex items-center text-[13px] font-medium rounded-md border border-black/15 bg-white hover:bg-black/5 text-black transition-colors"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on GitHub
            </button>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="px-4 py-2 flex items-center text-[13px] font-medium rounded-md bg-black hover:bg-black/85 text-white transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
