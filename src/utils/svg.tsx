import React from 'react';
import { Record } from './db';

export const TopSVG: React.FC<{ record: Partial<Record> }> = ({ record }) => {
  const { chest, stomach, sleeves, arm, halfBack, fullBack, topLength } = record;
  
  return (
    <svg viewBox="0 0 100 130" className="w-full max-w-[140px] h-auto block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .t0{fill:#1E1A18;stroke:#3D3830;stroke-width:1}
          .t1{fill:none;stroke:#C9A96E;stroke-width:.7;stroke-dasharray:2.5,2}
          .tx{font-size:4.5px;fill:#C9A96E;font-family:'Syne Mono',monospace}
        `}</style>
      </defs>
      <ellipse cx="50" cy="13" rx="9" ry="11" className="t0"/>
      <rect x="45" y="23" width="10" height="6" className="t0"/>
      <path d="M18 40 Q14 31 45 29L55 29Q86 31 82 40" className="t0"/>
      <path d="M18 40L15 92Q50 100 85 92L82 40" className="t0"/>
      {chest && <><line x1="20" y1="52" x2="80" y2="52" className="t1"/><text x="32" y="50" className="tx">chest</text></>}
      {stomach && <><line x1="21" y1="70" x2="79" y2="70" className="t1"/><text x="30" y="68" className="tx">stomach</text></>}
      <path d="M18 40L5 77Q8 81 15 78L22 44" className="t0"/>
      <path d="M82 40L95 77Q92 81 85 78L78 44" className="t0"/>
      {sleeves && <text x="0" y="62" className="tx" transform="rotate(-72,6,60)">sleeve</text>}
      {arm && <text x="0" y="44" className="tx">arm</text>}
      {(halfBack || fullBack) && <><line x1="50" y1="29" x2="50" y2="92" className="t1"/><text x="52" y="55" className="tx">back</text></>}
      {topLength && <><line x1="14" y1="29" x2="14" y2="92" className="t1"/><text x="1" y="70" className="tx" transform="rotate(-90,14,60)">len</text></>}
    </svg>
  );
};

export const DownSVG: React.FC<{ record: Partial<Record> }> = ({ record }) => {
  const { waist, hip, bass, thigh, knee, downLength } = record;
  
  return (
    <svg viewBox="0 0 100 140" className="w-full max-w-[140px] h-auto block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .d0{fill:#1E1A18;stroke:#3D3830;stroke-width:1}
          .d1{fill:none;stroke:#C9A96E;stroke-width:.7;stroke-dasharray:2.5,2}
          .dx{font-size:4.5px;fill:#C9A96E;font-family:'Syne Mono',monospace}
        `}</style>
      </defs>
      <rect x="22" y="5" width="56" height="9" rx="2" className="d0"/>
      <path d="M22 14Q18 22 20 32L80 32Q82 22 78 14" className="d0"/>
      {waist && <><line x1="22" y1="14" x2="78" y2="14" className="d1"/><text x="26" y="13" className="dx">waist</text></>}
      {hip && <><line x1="20" y1="30" x2="80" y2="30" className="d1"/><text x="33" y="29" className="dx">hip</text></>}
      <path d="M20 32L15 134Q28 138 38 134L44 54L50 54" className="d0"/>
      <path d="M80 32L85 134Q72 138 62 134L56 54L50 54" className="d0"/>
      <path d="M44 54Q50 64 56 54" className="d0"/>
      {thigh && <><line x1="16" y1="68" x2="44" y2="68" className="d1"/><text x="17" y="66" className="dx">thigh</text></>}
      {knee && <><line x1="17" y1="98" x2="42" y2="98" className="d1"/><text x="18" y="96" className="dx">knee</text></>}
      {bass && <><line x1="19" y1="42" x2="43" y2="42" className="d1"/><text x="20" y="41" className="dx">bass</text></>}
      {downLength && <><line x1="88" y1="32" x2="88" y2="134" className="d1"/><text x="90" y="90" className="dx" transform="rotate(90,88,90)">len</text></>}
    </svg>
  );
};
