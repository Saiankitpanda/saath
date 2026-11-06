import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Saath — Someone alongside you",
  description: "Talk to a listener, practise a hard conversation, or sit with a circle. Someone alongside you.",
  icons: { icon: "/favicon.svg" },
};

/** Apply saved light theme tokens before paint to avoid a wrong-colour flash. */
const themeBoot = `(function(){try{var r=localStorage.getItem('saath-appearance-v1');if(!r)return;var p=JSON.parse(r);if(!p)return;var light={pageBg:'#f3f6f2',cardSurface:'#fffcf8',accent:'#5f7a64',onAccent:'#ffffff',text:'#24312a',muted:'#5d6e64',border:'#d2ddd4'};var starters={'sage-morning':{pageBg:'#eef5f0',cardSurface:'#ffffff',accent:'#5f7a64',onAccent:'#ffffff',text:'#24312a',muted:'#5d6e64',border:'#c9d6cc'},'sandstone':{pageBg:'#f7f1ea',cardSurface:'#fffdf9',accent:'#8a6b52',onAccent:'#ffffff',text:'#2f261f',muted:'#6e5d50',border:'#e0d3c4'},'soft-sky':{pageBg:'#eef3f8',cardSurface:'#ffffff',accent:'#4f6f8f',onAccent:'#ffffff',text:'#1f2a36',muted:'#5c6b78',border:'#d0dae4'},'peach-garden':{pageBg:'#f8efe8',cardSurface:'#fffaf7',accent:'#b57a5c',onAccent:'#ffffff',text:'#32261f',muted:'#746356',border:'#e5d4c7'},'rose-clay':{pageBg:'#f6ecee',cardSurface:'#fffbfb',accent:'#9a5f6e',onAccent:'#ffffff',text:'#332328',muted:'#74555d',border:'#e2cdd2'}};var id=p.activeThemeId||'saath-default';var tokens=light;var motif='none';if(id&&id!=='saath-default'&&id!=='saath-dark-default'){var found=null;if(Array.isArray(p.presets)){for(var j=0;j<p.presets.length;j++){if(p.presets[j]&&p.presets[j].id===id){found=p.presets[j];break;}}}if(found&&found.tokens){tokens=found.tokens;motif=found.motif||'none';}else if(starters[id]){tokens=starters[id];}}function mix(a,b,t){function c(h,i){return parseInt(h.slice(1+i*2,3+i*2),16)}function h(n){n=Math.max(0,Math.min(255,Math.round(n)));return n.toString(16).padStart(2,'0')}var ar=c(a,0),ag=c(a,1),ab=c(a,2),br=c(b,0),bg=c(b,1),bb=c(b,2);return '#'+h(ar+(br-ar)*t)+h(ag+(bg-ag)*t)+h(ab+(bb-ab)*t)}var secondary=mix(tokens.pageBg,tokens.border,0.35);var accentHover=mix(tokens.accent,'#000000',0.14);var inputBg=mix(tokens.cardSurface,tokens.pageBg,0.28);var d=document.documentElement;d.style.setProperty('--page-bg',tokens.pageBg);d.style.setProperty('--page-bg-secondary',secondary);d.style.setProperty('--ivory',tokens.pageBg);d.style.setProperty('--card',tokens.cardSurface);d.style.setProperty('--elevated',mix(tokens.cardSurface,'#ffffff',0.04));d.style.setProperty('--ink',tokens.text);d.style.setProperty('--muted',tokens.muted);d.style.setProperty('--placeholder',mix(tokens.muted,'#ffffff',0.22));d.style.setProperty('--line',tokens.border);d.style.setProperty('--input-bg',inputBg);d.style.setProperty('--green',tokens.accent);d.style.setProperty('--orange',tokens.accent);d.style.setProperty('--accent',tokens.accent);d.style.setProperty('--accent-hover',accentHover);d.style.setProperty('--on-accent',tokens.onAccent);d.style.setProperty('--selected',mix(tokens.cardSurface,tokens.accent,0.14));d.style.setProperty('--sage',secondary);d.style.setProperty('--peach',mix(tokens.cardSurface,tokens.accent,0.12));d.style.setProperty('--saath-art-surface','#f4f1ea');d.style.setProperty('--focus',tokens.accent);d.style.setProperty('--error','#a14b3c');d.style.setProperty('--warning','#9a7340');d.style.setProperty('--success','#4f7a5a');d.dataset.theme='light';d.dataset.motif=motif;d.dataset.motion=p.motionEnabled===false?'off':'on';d.style.colorScheme='light';}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
