const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'Community.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Rotating Placeholders & Tag State
const stateString = `const [posting, setPosting] = useState(false);`;
const newStateString = `const [posting, setPosting] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const placeholders = [
      "Share a conservation win...",
      "Ask the community something...",
      "What's your water tip this week?"
  ];
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
      }, 4000);
      return () => clearInterval(interval);
  }, []);`;
content = content.replace(stateString, newStateString);

// 2. Sidebar Redesign
const sidebarOld = `<div className="hidden lg:block lg:col-span-3 space-y-8">
                    <div className="bg-white/50 border border-[#D6D1C7] p-6 shadow-sm lg:sticky lg:top-32">`;
const sidebarNew = `<div className="hidden lg:block lg:col-span-3 space-y-8">
                    <div className="bg-[#FDFAF5] border border-[#D6D1C7] p-6 shadow-sm lg:sticky lg:top-32 rounded-2xl">
                        <div className="mb-8 pb-6 border-b border-[#D6D1C7]/50 text-center">
                            <span className="text-4xl mb-3 block">🌊</span>
                            <div className="font-serif text-[#2C2A26] text-2xl mb-1">24,405</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#98A89A]">members conserving together</div>
                        </div>`;
content = content.replace(sidebarOld, sidebarNew);

// 2b. Sidebar Active States & Descriptions (Joined Groups)
const joinedItemOld = `className={\`w-full text-left flex items-center gap-3 p-3 transition-colors \${activeGroupId === group.id ? 'bg-[#2C2A26] text-[#F5F2EB]' : 'hover:bg-[#EBE7DE] text-[#5D5A53]'}\`}`;
const joinedItemNew = `className={\`w-full text-left flex items-start gap-4 p-4 transition-colors border-l-4 \${activeGroupId === group.id ? 'bg-white border-l-[#98A89A] shadow-sm rounded-r-xl text-[#2C2A26]' : 'hover:bg-[#EBE7DE]/50 text-[#5D5A53] border-l-transparent'}\`}`;
content = content.replace(joinedItemOld, joinedItemNew);

const exploreItemOld = `className={\`w-full text-left flex items-center gap-3 p-3 transition-colors \${activeGroupId === group.id ? 'bg-[#2C2A26] text-[#F5F2EB]' : 'hover:bg-[#EBE7DE] text-[#5D5A53]'}\`}`;
const exploreItemNew = `className={\`w-full text-left flex items-start gap-4 p-4 transition-colors border-l-4 \${activeGroupId === group.id ? 'bg-white border-l-[#98A89A] shadow-sm rounded-r-xl text-[#2C2A26]' : 'hover:bg-[#EBE7DE]/50 text-[#5D5A53] border-l-transparent'}\`}`;
content = content.replace(exploreItemOld, exploreItemNew);

// Wrap group.name with descriptions in sidebar mapping
// This part is tricky because we replaced the inner span. Let's do a heavier regex replacement for the <li> structure.
content = content.replace(/<span className="text-sm font-medium truncate">{group\.name}<\/span>/g, 
  `<div>
      <span className="text-sm font-bold block mb-0.5">{group.name}</span>
      <span className="text-[10px] text-[#A8A29E] block mb-1 uppercase tracking-widest">{(group.name.length * 123) % 1000 + 100} Members</span>
      <span className="text-xs opacity-70 line-clamp-2 leading-relaxed">{group.description || 'A community dedicated to water conservation.'}</span>
  </div>`);

// 3. Post Composer Redesign
const composerOldRegex = /<div className="bg-white p-4 md:p-6 mb-8 shadow-sm border border-\[#EBE7DE\]">[\s\S]*?<textarea[\s\S]*?<\/textarea>[\s\S]*?<div className="flex justify-end">[\s\S]*?<button[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const composerNew = `<div className="bg-[#FDFAF5] p-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#EBE7DE] rounded-2xl">
                            <div className="flex gap-4 mb-4">
                                <img src={\`https://i.pravatar.cc/150?u=\${currentUserId || 'default'}\`} className="w-10 h-10 rounded-full object-cover border border-[#D6D1C7]" alt="You" />
                                <div className="flex-1">
                                    <textarea 
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder={placeholders[placeholderIdx]}
                                        disabled={posting}
                                        className="w-full bg-white border border-[#D6D1C7] rounded-xl outline-none text-[#2C2A26] placeholder-[#A8A29E] resize-none p-4 focus:border-[#98A89A] focus:ring-1 focus:ring-[#98A89A] transition-all disabled:opacity-50 text-sm md:text-base leading-relaxed"
                                        rows={3}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pl-14">
                                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                    {['💧 Tip', '🏆 Win', '❓ Question'].map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                            className={\`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all \${selectedTag === tag ? 'bg-[#98A89A] text-white shadow-sm' : 'bg-white border border-[#D6D1C7] text-[#789094] hover:border-[#98A89A]'}\`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={handlePost} 
                                    disabled={!newPost.trim() || posting} 
                                    className="w-full md:w-auto bg-[#98A89A] text-[#F5F2EB] px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#859F94] hover:shadow-md disabled:opacity-50 transition-all shrink-0"
                                >
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>`;
content = content.replace(composerOldRegex, composerNew);

// 4. Feed Post Redesign
const postsOldRegex = /<div key=\{post\.id\} className="bg-\[#F9F8F6\] p-4 md:p-6 border border-\[#EBE7DE\] flex gap-4 group\/post hover:bg-white transition-colors">/;
const postsNew = `<div key={post.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#EBE7DE] flex gap-4 md:gap-6 group/post hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">`;
content = content.replace(postsOldRegex, postsNew);

// Bigger Avatar & Username / Date structural change
const profileHeadOldRegex = /<img src=\{post\.avatar\} alt=\{post\.username\} className="w-10 h-10 rounded-full object-cover grayscale" \/>[\s\S]*?<div className="flex-1">[\s\S]*?<div className="flex justify-between items-start mb-2">[\s\S]*?<span className="font-serif font-medium text-\[#2C2A26\] text-sm md:text-base">\{post\.username\}<\/span>[\s\S]*?<div className="flex items-center gap-3">[\s\S]*?<span className="text-\[10px\] uppercase tracking-widest text-\[#A8A29E\]">\{post\.timestamp\}<\/span>/;
const profileHeadNew = `<img src={post.avatar} alt={post.username} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-[#EBE7DE] shadow-sm" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="font-bold text-[#2C2A26] text-sm md:text-base block">{post.username}</span>
                                                <span className="text-[11px] uppercase tracking-widest text-[#A8A29E] mt-0.5 block">{post.timestamp}</span>
                                            </div>
                                            <div className="flex items-center gap-3">`;
content = content.replace(profileHeadOldRegex, profileHeadNew);

// The Delete button closing tags need to be respected, they are kept untouched.

// Like and Comment Buttons
const likeButtonRegex = /<div className="flex items-center justify-between">[\s\S]*?<button className="text-xs text-\[#A8A29E\] hover:text-\[#2C2A26\] flex items-center gap-1 transition-colors">[\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?\{post\.likes\}[\s\S]*?<\/button>[\s\S]*?<\/div>/;
const likeCommentNew = `<div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#F5F2EB]">
                                                <button className="text-sm text-[#A8A29E] hover:text-red-500 flex items-center gap-2 transition-colors group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                    </svg>
                                                    <span className="font-medium">{post.likes}</span>
                                                </button>
                                                <button className="text-sm text-[#A8A29E] hover:text-[#98A89A] flex items-center gap-2 transition-colors group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.06a12.08 12.08 0 0 0 2.555.31Z" />
                                                    </svg>
                                                    <span className="font-medium">0</span>
                                                </button>
                                            </div>`;
content = content.replace(likeButtonRegex, likeCommentNew);

// Ensure post body text has full readability and formatting
content = content.replace(/<p className="text-\[#5D5A53\] text-sm leading-relaxed mb-4 whitespace-pre-wrap break-words">\{post.content\}<\/p>/, 
  `<p className="text-[#2C2A26] text-[15px] leading-relaxed mb-4 whitespace-pre-wrap break-words">{post.content}</p>`);

// 5. Empty State Redesign
const emptyOldRegex = /<div className="text-center py-12 text-\[#A8A29E\] bg-\[#F9F8F6\] border border-\[#EBE7DE\]">[\s\S]*?Be the first to share something in \{activeGroupName\}\.[\s\S]*?<\/div>/;
const emptyNew = `<div className="flex flex-col items-center justify-center py-24 text-center">
                                <span className="text-6xl mb-6 block drop-shadow-sm">🦦</span>
                                <h3 className="text-2xl font-serif text-[#2C2A26] mb-3">Be the first to share something this week</h3>
                                <p className="text-[#A8A29E] text-sm">The community is listening.</p>
                            </div>`;
content = content.replace(emptyOldRegex, emptyNew);

fs.writeFileSync(filePath, content);
console.log('Community page updated!');
