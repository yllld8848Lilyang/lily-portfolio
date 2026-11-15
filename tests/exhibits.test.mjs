import {test} from 'node:test';
import assert from 'node:assert/strict';

test('Confirmed empty sections render a neutral state for every layout, then allow real content',async()=>{
 globalThis.document={addEventListener(){},getElementById(){return {addEventListener(){}};}};
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
    assert.ok(!host.innerHTML.includes(items[0].title));
    module.items=items;
    mountExhibit(host,module.id,'en');
    assert.ok(!host.innerHTML.includes('No content to show yet'));
    mountExhibit(host,module.id,'zh');
    assert.ok(!host.innerHTML.includes('暂无展示内容'));
   } finally {module.items=items;}
  }
 } finally {delete globalThis.document;}
});

test('Small-U interactive chapter embeds the bilingual prototype with fullscreen and direct access',async()=>{
 globalThis.document={addEventListener(){},getElementById(){return {addEventListener(){}};}};
 try {
  const {categories}=await import('../src/content.js');
  const {mountExhibit}=await import('../src/exhibits.js');
  const host={innerHTML:''};
  const project=categories.find((module)=>module.id==='ai-projects');
  const item=project.items[0];
  const demoIndex=item.chapters.findIndex((chapter)=>chapter.embedUrl);
  assert.ok(demoIndex>0,'the demo follows the project story');
  const {chapters}=item;
  try {
   item.chapters=[chapters[demoIndex]];
   mountExhibit(host,'ai-projects','en');
   assert.match(host.innerHTML,/Small-U Feedback Insights Assistant interactive prototype/);
   assert.match(host.innerHTML,/data-embed-fullscreen/);
   assert.match(host.innerHTML,/Open the full demo/);
   assert.match(host.innerHTML,/anonymized dashboard/);
   mountExhibit(host,'ai-projects','zh');
   assert.match(host.innerHTML,/小U反馈洞察助手交互原型/);
   assert.match(host.innerHTML,/全屏体验原型/);
   assert.match(host.innerHTML,/新窗口打开完整原型/);
   assert.match(host.innerHTML,/脱敏数据/);
  } finally {item.chapters=chapters;}
 } finally {delete globalThis.document;}
});
