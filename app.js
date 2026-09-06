
const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const count = document.getElementById("resultCount");
const results = document.getElementById("results");

function normalize(v=""){
  return String(v).toLowerCase().normalize("NFKC")
    .replace(/[()[\]{}<>〈〉《》「」『』“”"'·:;,.!?~\-_/]/g," ")
    .replace(/\s+/g," ").trim();
}
function tokens(v){ return normalize(v).split(" ").filter(Boolean); }

function score(book, query){
  const q=normalize(query);
  if(!q) return 1;

  const title=normalize(book.title);
  const author=normalize(book.authorDisplay || book.author);
  const publisher=normalize(book.publisher);
  const isbn=normalize(book.isbn);
  const all=`${title} ${author} ${publisher} ${isbn}`;
  const qs=tokens(q);
  let s=0;

  if(title===q) s+=120;
  if(title.includes(q)) s+=65;
  if(author===q) s+=58;
  if(publisher===q) s+=48;
  if(isbn===q) s+=50;
  if(all.includes(q)) s+=24;

  for(const t of qs){
    if(title.includes(t)) s+=16;
    if(author.includes(t)) s+=14;
    if(publisher.includes(t)) s+=12;
    if(isbn.includes(t)) s+=11;
  }

  const matched=qs.filter(t=>all.includes(t)).length;
  if(qs.length>1 && matched===qs.length) s+=38;
  else if(qs.length>1 && matched>=Math.ceil(qs.length/2)) s+=12;

  return s;
}
function esc(v){
  return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
function highlight(text, query){
  let safe=esc(text);
  const qs=[...new Set(tokens(query))].filter(t=>t.length>=2).sort((a,b)=>b.length-a.length);
  for(const t of qs){
    const e=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    safe=safe.replace(new RegExp(`(${e})`,"gi"),"<mark>$1</mark>");
  }
  return safe;
}
function link(url,label,cls){
  return url
    ? `<a class="store ${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : `<span class="store disabled">${label} 없음</span>`;
}
function render(query=""){
  const list=BOOKS.map(book=>({book,score:score(book,query)}))
    .filter(x=>!query.trim() || x.score>0)
    .sort((a,b)=>b.score-a.score || Number(b.book.no||0)-Number(a.book.no||0));

  count.textContent=query.trim()
    ? `“${query.trim()}” 검색 결과 ${list.length}권`
    : `출판 도서 ${list.length}권`;

  if(!list.length){
    results.innerHTML=`<div class="empty">
      <strong>찾은 책이 없습니다.</strong><br>
      제목 일부 · 저자명 · 출판사 · ISBN 중 기억나는 정보를 입력해 보세요.
    </div>`;
    return;
  }

  results.innerHTML=list.map(({book})=>`
    <article class="card">
      <div class="kicker">도서번호 ${book.no ?? "-"}</div>
      <h2 class="title">${highlight(book.title,query)}</h2>
      <div class="meta">
        저자 <span class="author">${highlight(book.authorDisplay || book.author,query)}</span><br>
        출판사 <span class="publisher">${highlight(book.publisher,query)}</span><br>
        ISBN ${book.isbn || "미등록"}
      </div>
      <div class="store-links">
        ${link(book.yes24Url,"YES24","yes24")}
        ${link(book.kyoboUrl,"교보문고","kyobo")}
        ${link(book.aladinUrl,"알라딘","aladin")}
      </div>
    </article>
  `).join("");
}
function search(){render(input.value);}
btn.addEventListener("click",search);
input.addEventListener("input",search);
input.addEventListener("keydown",e=>{if(e.key==="Enter")search();});
clearBtn.addEventListener("click",()=>{input.value="";input.focus();render("");});
document.querySelectorAll(".chip").forEach(c=>c.addEventListener("click",()=>{
  input.value=c.dataset.q; search();
}));
render("");
