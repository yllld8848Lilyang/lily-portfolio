import {test} from 'node:test';
import assert from 'node:assert/strict';

const stubDocument = () => { globalThis.document={addEventListener(){},getElementById(){return {addEventListener(){}};}}; };

test('Confirmed empty sections render a neutral state for every layout, then allow real content',async()=>{
 stubDocument();
 try {
  const {categories}=await import('../src/content.js');
  const {mountExhibit}=await import('../src/exhibits.js');
  const host={innerHTML:''};
  for(const module of categories){
   const items=module.items;
   try {
    module.items=[];
    mountExhibit(host,module.id,'en');
    assert.match(host.innerHTML,/No content to show yet/);
    mountExhibit(host,module.id,'zh');
    assert.match(host.innerHTML,/暂无展示内容/);
    module.items=items;
    mountExhibit(host,module.id,'en');
    assert.ok(!host.innerHTML.includes('No content to show yet'));
   } finally {module.items=items;}
  }
 } finally {delete globalThis.document;}
});

test('Areas are CV Video, Marketing & Growth, AI Projects and Experience, in that order',async()=>{
 const {categories}=await import('../src/content.js');
 assert.deepEqual(categories.map(m=>m.id),['cv-video','marketing-growth','ai-projects','experience']);
});

test('English copy contains no Chinese characters',async()=>{
 const data=(await import('../src/portfolio.json',{with:{type:'json'}})).default;
 const bad=[];
 const walk=(node,path)=>{
  if(Array.isArray(node)) return node.forEach((v,i)=>walk(v,`${path}[${i}]`));
  if(node && typeof node==='object') return Object.entries(node).forEach(([k,v])=>{ if(!k.endsWith('Zh')) walk(v,`${path}.${k}`); });
  if(typeof node==='string' && /[\u4e00-\u9fff]/.test(node)) bad.push(path);
 };
 walk(data,'');
 assert.deepEqual(bad,[]);
});

test('Case headers separate company, industry and role; samples come before the story',async()=>{
 stubDocument();
 try {
  const {mountExhibit}=await import('../src/exhibits.js');
  const host={innerHTML:''};
  mountExhibit(host,'marketing-growth','en');
  const html=host.innerHTML;
  assert.match(html,/class="industry-tag">Fire &amp; car safety products/);
  assert.match(html,/<h3>Starshine Group<\/h3>/);
  assert.match(html,/class="role-line">E-commerce New Media Operations Intern/);
  assert.ok(html.indexOf('media-grid')<html.indexOf('gar-row'));
  assert.match(html,/<video[^>]+controls/);
  assert.match(html,/Content &amp; Social/);
  mountExhibit(host,'marketing-growth','zh');
  assert.match(host.innerHTML,/星耀集团/);
  assert.match(host.innerHTML,/已做脱敏处理/);
 } finally {delete globalThis.document;}
});

test('InsightLoop shows screenshots and opens the demo in a new tab instead of an iframe',async()=>{
 stubDocument();
 try {
  const {mountExhibit}=await import('../src/exhibits.js');
  const host={innerHTML:''};
  mountExhibit(host,'ai-projects','en');
  assert.match(host.innerHTML,/<h3>InsightLoop<\/h3>/);
  assert.match(host.innerHTML,/Built at Joy Media to gather feedback for Small-U/);
  assert.match(host.innerHTML,/Open the full demo/);
  assert.doesNotMatch(host.innerHTML,/<iframe/);
  mountExhibit(host,'ai-projects','zh');
  assert.match(host.innerHTML,/自主开发，任何产品团队都能使用/);
 } finally {delete globalThis.document;}
});
