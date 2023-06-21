#!/usr/bin/env -S deno run --no-prompt --allow-read --allow-write --allow-run
import { parse } from "https://deno.land/std@0.192.0/yaml/mod.ts";
import { find } from "https://deno.land/x/lodash@4.17.15-es/lodash.js";
import { TextReader, Uint8ArrayWriter, ZipWriter } from "https://deno.land/x/zipjs/index.js";

function parseCards(cards: Array<Record<string, unknown>>) {
  return Object.fromEntries(cards.map((card) => [`type-${crypto.randomUUID()}`, card]));
}

const cardTypes = {
  "e350ed7c-e096-4e23-8a38-41aec66d5949": "Level 1 Challenges",
  "485d3108-8257-487a-b445-aabf7bbf3235": "Level 2 Challenges",
  "c8fa0275-9c3b-40ac-a95d-80014d4020da": "Level 3 Challenges",
  "a9170c8a-2b15-4dc8-9565-9f86d198eba5": "Level 1 Opportunities",
  "85181208-d66d-44a4-ad6a-b39c42cf81fe": "Level 2 Opportunities",
  "9acb0098-0830-49d5-9df6-17c6ddcaa250": "Level 3 Opportunities",
};

const cards = parse(await Deno.readTextFile("cards.yml")) as Record<string, Array<Record<string, unknown>>>;
const output = JSON.parse(await Deno.readTextFile("template.json"));

for (const [id, name] of Object.entries(cardTypes)) {
  find(output, { id }).cardTypes = parseCards(cards[name]);
}

for (const item of output) {
  if (item.type === "cardDeck") {
    for (const [cardId, _] of Object.entries(item.cardTypes)) {
      output.push({
        id: crypto.randomUUID(),
        type: "card",
        cardType: cardId,
        deck: item.id,
        parent: null,
        x: item.x,
        y: item.y,
        z: item.z,
        dragging: null,
        draggingType: null,
        faceup: false,
      });
    }
  }
}

const zipFileWriter = new Uint8ArrayWriter();
const zipWriter = new ZipWriter(zipFileWriter);
await zipWriter.add("widgets.json", new TextReader(JSON.stringify(output)));
await zipWriter.close();
await Deno.writeFile("output.pcio", await zipFileWriter.getData());
