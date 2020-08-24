import { searchRepo } from './handler/search-repo';
import * as parse from "co-body";
import * as http from "http";
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as socketio from "socket.io";
const cors = require('@koa/cors');
import { getRepoList } from './handler/get-repo-list';
import { setUpImportRepo } from './handler/import';
import fetch from "node-fetch";
import { getMainServerUrl } from './utils/get-url';

const PORT = process.env.PORT || 80;

const app = new Koa();
const router = new Router();

app.use(cors({
   "origin": "http://localhost:3000",
}));
app.use(router.routes());

const server = http.createServer(app.callback());
const io = socketio(server);

setUpImportRepo(io);


router.post('/github/webhook', async (ctx) => {

   console.log("in hook")

   const payload = await parse(ctx);

   // tranform payload to commit
   const { repository, commits, trees_url: treesUrl } = payload;
   const repoName = repository.name;
   const ownerId = repository.owner.name;
   console.log(commits);

   const baseTreesUrl = treesUrl.replact("{/sha}", "");

   for (const commit of commits) {
      const { tree_id: treeId } = commit;
      const finalTreeUrl = `${baseTreesUrl}/${treeId}`;
      const treeResponse = await fetch(finalTreeUrl).then(res => res.json());
      const { tree } = treeResponse;
      for (const treeNode of tree) {
         const { path, url } = treeNode;
         const contentResponse = await fetch(url).then(res => res.json());
         const { content, encoding } = contentResponse;
         let decodedContent;

         if (encoding === "base64") {
            decodedContent = Buffer.from(content, "base64").toString();
         } else {
            decodedContent = content;
         }


      }
   }
   // const res = await fetch(`${getMainServerUrl()}/api/repository/new-commit`, {
   //    method: "POST",
   //    body: commit
   // }).then(res => res.json());
   // console.log(res);
});

router.get("/repos", getRepoList);
router.get("/search", searchRepo);


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
