import { resolveList } from "./resolveList";
import { buildCache } from "./test/testHelpers";

const listExampleText = `# Some lists!
1. Item 1
  1. Subitem 1
    1. Tertiary 1
    2. Tertiary 2
  2. Subitem 2
    1. Tertiary 1
2. Item 2
  1. Subitem 1
    1. Tertiary 1
 
987. Type 1
54) Type 2
- Type 3
* Type 4
+ Type 5`;

const listItems = buildCache(listExampleText).listItems;

describe(resolveList, () => {
  it("returns null for unfound item", () => {
    expect(
      resolveList(listExampleText, listItems, "#-Doesn't exist")
    ).toBeNull();
  });

  it("returns top-level list items", () => {
    expect(resolveList(listExampleText, listItems, "#-Item 1")).toStrictEqual({
      type: "list-item",
      listItem: listItems[0],
      children: [listItems[1], listItems[4]],
      start: listItems[0].position.start,
      end: listItems[5].position.end,
    });
    expect(resolveList(listExampleText, listItems, "#-Item 2")).toStrictEqual({
      type: "list-item",
      listItem: listItems[6],
      children: [listItems[7]],
      start: listItems[6].position.start,
      end: listItems[8].position.end,
    });
  });

  it("returns sub-items and defaults to first found", () => {
    expect(
      resolveList(listExampleText, listItems, "#-Subitem 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[1],
      children: [listItems[2], listItems[3]],
      start: listItems[1].position.start,
      end: listItems[3].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Subitem 2")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[4],
      children: [listItems[5]],
      start: listItems[4].position.start,
      end: listItems[5].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Tertiary 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[2],
      children: [],
      start: listItems[2].position.start,
      end: listItems[2].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Tertiary 2")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[3],
      children: [],
      start: listItems[3].position.start,
      end: listItems[3].position.end,
    });
  });

  it("handles multi-level subpath", () => {
    expect(
      resolveList(listExampleText, listItems, "#-Item 1#-Subitem 1#-Tertiary 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[2],
      children: [],
      start: listItems[2].position.start,
      end: listItems[2].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Subitem 1#-Tertiary 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[2],
      children: [],
      start: listItems[2].position.start,
      end: listItems[2].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Subitem 2#-Tertiary 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[5],
      children: [],
      start: listItems[5].position.start,
      end: listItems[5].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Item 1#-Subitem 2#-Tertiary 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[5],
      children: [],
      start: listItems[5].position.start,
      end: listItems[5].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Item 2#-Subitem 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[7],
      children: [listItems[8]],
      start: listItems[7].position.start,
      end: listItems[8].position.end,
    });
    expect(
      resolveList(listExampleText, listItems, "#-Item 2#-Subitem 1#-Tertiary 1")
    ).toStrictEqual({
      type: "list-item",
      listItem: listItems[8],
      children: [],
      start: listItems[8].position.start,
      end: listItems[8].position.end,
    });
  });

  it("handles multiple bullet types", () => {
    expect(resolveList(listExampleText, listItems, "#-Type 1")).toStrictEqual({
      type: "list-item",
      listItem: listItems[9],
      children: [],
      start: listItems[9].position.start,
      end: listItems[9].position.end,
    });
    expect(resolveList(listExampleText, listItems, "#-Type 2")).toStrictEqual({
      type: "list-item",
      listItem: listItems[10],
      children: [],
      start: listItems[10].position.start,
      end: listItems[10].position.end,
    });
    expect(resolveList(listExampleText, listItems, "#-Type 3")).toStrictEqual({
      type: "list-item",
      listItem: listItems[11],
      children: [],
      start: listItems[11].position.start,
      end: listItems[11].position.end,
    });
    expect(resolveList(listExampleText, listItems, "#-Type 4")).toStrictEqual({
      type: "list-item",
      listItem: listItems[12],
      children: [],
      start: listItems[12].position.start,
      end: listItems[12].position.end,
    });
    expect(resolveList(listExampleText, listItems, "#-Type 5")).toStrictEqual({
      type: "list-item",
      listItem: listItems[13],
      children: [],
      start: listItems[13].position.start,
      end: listItems[13].position.end,
    });
  });
});
