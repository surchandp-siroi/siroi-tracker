"use client";

import { Accordion, AccordionItem } from "@/components/base/accordion/accordion";

/** The gallery tile: the contained FAQ with its first answer open, scaled to the card. */
export function AccordionPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <Accordion
        variant="contained"
        indicator="plus"
        defaultExpandedKeys={["billing"]}
        className="w-[360px] shrink-0 scale-[0.74]"
      >
        <AccordionItem id="billing" title="How does billing work?">
          <p>Plans are billed monthly for every active seat.</p>
        </AccordionItem>
        <AccordionItem id="plans" title="Can I change plans later?">
          <p>Upgrades apply right away.</p>
        </AccordionItem>
        <AccordionItem id="data" title="What happens to my data?">
          <p>It stays readable for 30 days.</p>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
