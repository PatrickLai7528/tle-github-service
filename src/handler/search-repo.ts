import * as Koa from "koa";
import fetch from "node-fetch";
import { githubAPIUrls } from "../config/github.config";

export const searchRepo = async (ctx: Koa.Context) => {
   const q = ctx.query.q;
   const ghToken = ctx.query.token;
   const ghId = ctx.query.ghId;
   const queryString = `?q=${q}+user:${ghId}`;
   const res = await fetch(`${githubAPIUrls.searchRepo}${queryString}`, {
      headers: {
         accept: "application/json",
         Authorization: `token ${ghToken}`
      }
   }).then(res => res.json());

   ctx.body = res;
}