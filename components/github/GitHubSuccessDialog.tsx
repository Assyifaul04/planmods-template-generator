// components/github/GitHubSuccessDialog.tsx
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Monitor, Copy, Check, Download, GitBranch, Loader2 } from "lucide-react";
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
  
  // State untuk memilih HTTPS atau SSH
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

  // Konversi HTTPS URL ke SSH URL secara sederhana
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
      <DialogContent 
        className="!max-w-[900px] w-[95vw] bg-[#0d1117] border border-[#30363d] p-0 text-[#c9d1d9] font-sans shadow-2xl [&>button]:hidden overflow-hidden"
      >
        <div className="flex flex-col bg-[#0d1117] rounded-lg">
            
          {/* Section 1: Quick setup */}
          <div className="p-5 border-b border-[#30363d]">
            <h3 className="font-semibold text-[16px] mb-4 text-white">
              Quick setup — if you've done this kind of thing before
            </h3>
            
            <div className="flex items-center gap-3 mb-4 text-[13px]">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] font-medium text-[#c9d1d9] transition-colors">
                <Monitor className="w-4 h-4" /> Set up in Desktop
              </button>
              
              <span className="text-[#8b949e]">or</span>
              
              <div className="flex flex-1 items-center">
                <div className="flex rounded-l-md border border-[#30363d] font-medium overflow-hidden">
                  <button 
                    onClick={() => setProtocol("HTTPS")}
                    className={`px-3 py-1.5 border-r border-[#30363d] transition-colors ${protocol === "HTTPS" ? "bg-[#1f6feb]/10 text-[#58a6ff]" : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]"}`}
                  >
                    HTTPS
                  </button>
                  <button 
                    onClick={() => setProtocol("SSH")}
                    className={`px-3 py-1.5 transition-colors ${protocol === "SSH" ? "bg-[#1f6feb]/10 text-[#58a6ff]" : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]"}`}
                  >
                    SSH
                  </button>
                </div>
                
                <div className="flex flex-1 items-center border-y border-r border-[#30363d] rounded-r-md bg-[#010409] overflow-hidden group focus-within:border-[#58a6ff]">
                  <input 
                    type="text" 
                    value={currentUrl} 
                    readOnly 
                    className="flex-1 bg-transparent px-3 py-1.5 text-[13px] text-[#8b949e] outline-none"
                  />
                  <button 
                    onClick={() => copy(currentUrl, setUrlCopied)}
                    className="px-2.5 py-1.5 border-l border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors h-full flex items-center justify-center"
                    aria-label="Copy to clipboard"
                  >
                    {urlCopied ? <Check className="w-4 h-4 text-[#3fb950]"/> : <Copy className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[13px] text-[#8b949e]">
              Get started by <a href="#" className="text-[#58a6ff] hover:underline">creating a new file</a> or <a href="#" className="text-[#58a6ff] hover:underline">uploading an existing file</a>. We recommend every repository include a <a href="#" className="text-[#58a6ff] hover:underline">README</a>, <a href="#" className="text-[#58a6ff] hover:underline">LICENSE</a>, and <a href="#" className="text-[#58a6ff] hover:underline">.gitignore</a>.
            </p>
          </div>

          {/* Section 2: Create a new repository */}
          <div className="p-5 border-b border-[#30363d]">
            <h3 className="font-semibold text-[16px] mb-4 text-white">
              ...or create a new repository on the command line
            </h3>
            
            <div className="relative rounded-md border border-[#30363d] bg-[#0d1117] p-4 group">
              <button 
                onClick={() => copy(newRepoCommands, setNewRepoCopied)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] bg-[#21262d] border border-[#30363d] opacity-0 group-hover:opacity-100 transition-all"
              >
                {newRepoCopied ? <Check className="w-4 h-4 text-[#3fb950]"/> : <Copy className="w-4 h-4"/>}
              </button>
              <pre className="text-[13px] font-mono text-[#e6edf3] leading-snug whitespace-pre">
                {newRepoCommands}
              </pre>
            </div>
          </div>

          {/* Section 3: Push an existing repository */}
          <div className="p-5 border-b border-[#30363d]">
            <h3 className="font-semibold text-[16px] mb-4 text-white">
              ...or push an existing repository from the command line
            </h3>
            
            <div className="relative rounded-md border border-[#30363d] bg-[#0d1117] p-4 group">
              <button 
                onClick={() => copy(existingRepoCommands, setExistingRepoCopied)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] bg-[#21262d] border border-[#30363d] opacity-0 group-hover:opacity-100 transition-all"
              >
                {existingRepoCopied ? <Check className="w-4 h-4 text-[#3fb950]"/> : <Copy className="w-4 h-4"/>}
              </button>
              <pre className="text-[13px] font-mono text-[#e6edf3] leading-snug whitespace-pre">
                {existingRepoCommands}
              </pre>
            </div>
          </div>

          {/* Section 4: Actions (Download & GitHub) */}
          <div className="px-5 py-4 bg-[#010409] flex flex-wrap justify-end gap-3 rounded-b-lg">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-[13px] font-medium rounded-md hover:bg-[#21262d] text-[#c9d1d9] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.open(repoUrl, "_blank")}
              className="px-4 py-2 flex items-center text-[13px] font-medium rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] transition-colors"
            >
              <GitBranch className="mr-2 h-4 w-4" />
              View on GitHub
            </button>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="px-4 py-2 flex items-center text-[13px] font-medium rounded-md border border-[rgba(240,246,252,0.1)] bg-[#238636] hover:bg-[#2ea043] text-white transition-colors disabled:opacity-50"
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