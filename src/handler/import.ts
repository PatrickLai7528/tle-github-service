import { cloneManyBranch, cloneManyCommit, cloneManyTree } from './../utils/import-utils';
import { IGHRepositoryRes } from "../types/github-api/repository"
import fetch from "node-fetch";
import { IGHBlobRes } from '../types/github-api/blob';

export const setUpImportRepo = (io: SocketIO.Server): void => {

   io.on("connection", (socket) => {

      console.log("connected")

      socket.on("startImport", async (repoRes: IGHRepositoryRes, ghToken: string) => {
         try {
            let stop: boolean = false;
            socket.on("stopImport", () => stop = true);

            const headers = {
               accept: "application/json",
               Authorization: `token ${ghToken}`
            };
            let {
               branches_url: branchesUrl,
               commits_url: commitsUrl,
               trees_url: treesUrl
            } = repoRes;

            // 1. clone branch
            branchesUrl = branchesUrl.replace("{/branch}", "");
            const branches = await cloneManyBranch(branchesUrl, headers);
            socket.emit("importBranchDone", branches);

            if (stop)
               socket.disconnect();

            // 2. clone commit
            commitsUrl = commitsUrl.replace("{/sha}", "");
            const commits = await cloneManyCommit(commitsUrl, headers);
            socket.emit("importCommitDone", commits);

            if (stop)
               socket.disconnect();

            // 3. clone file structure
            treesUrl = treesUrl.replace("{/sha}", "");
            let masterHeadSha;
            for (const branch of branches || []) {
               if (branch.name === repoRes.default_branch) {
                  masterHeadSha = branch.commitHeadSha;
                  break;
               }
            }
            const [trees, blobs] = await cloneManyTree(
               `${treesUrl}/${masterHeadSha}`,
               headers
            );
            socket.emit("importFileStructureDone", trees);

            if (stop)
               socket.disconnect();

            // 4. clone file content
            let shaFileContentMap: any = {};
            const fetchPromises: Promise<IGHBlobRes>[] = [];
            for (const blob of (blobs || [])) {
               const fetchPromise = fetch(blob.url, {
                  headers
               }).then(res => res.json());
               fetchPromises.push(fetchPromise);
            }
            const blobsRes: IGHBlobRes[] = await Promise.all(fetchPromises);
            blobsRes.forEach(({ sha, content, encoding }) => {
               shaFileContentMap[sha] =
                  encoding === "base64" ? Buffer.from(content, 'base64').toString() : content;
            });
            socket.emit("importFileContentDone", shaFileContentMap);

            socket.emit("allDone");

            socket.disconnect();
         } catch (e) {
            console.log(e);
         }
      })
   })

}