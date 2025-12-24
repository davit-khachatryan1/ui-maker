export interface SampleInput {
  id: string;
  label: string;
  html: string;
}

export const samples: SampleInput[] = [
  {
    id: 'figma-icon',
    label: 'Figma icon block',
    html: `<div className="self-stretch h-12 px-6 py-3 bg-neutral-900 border-b border-stone-500/20 inline-flex justify-start items-center gap-1.5">
  <div data-crypto="Default" className="w-4 h-4 relative overflow-hidden">
    <div className="w-4 h-4 left-0 top-0 absolute bg-amber-500" />
    <div className="w-2 h-3 left-[4.59px] top-[3.38px] absolute bg-white" />
  </div>
  <div className="flex-1 justify-start text-white text-sm font-normal font-['Manrope']">2.4066 BTC</div>
</div>`
  },
  {
    id: 'background-image',
    label: 'Background image div',
    html: `<div class="w-32 h-24 rounded-xl" style="background-image: url('https://placehold.co/200x150'); background-size: cover"></div>`
  },
  {
    id: 'wrappers',
    label: 'Wrapper cleanup',
    html: `<div>
  <div>
    <span>   Hello   world   </span>
  </div>
</div>`
  }
];
