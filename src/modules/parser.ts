import { excerptPic_video, MbBook } from "@alx-plugins/marginnote";

import PopupRecorder from "./PopupRecorder";
import { item, MNMark, node, ReturnBody, selection } from "./return";
import { scanObject } from "./tools";

const process = (node: node, rec: PopupRecorder, book?: MbBook): ReturnBody => {
  const currentBook = book ? scanObject(book) : undefined;

  const getLastAndSendTime = (
    data: node,
  ): { sendTime: ReturnBody["sendTime"]; last: ReturnBody["last"] } => {
    const last = rec.last;
    rec.push(data);
    const sendTime = (rec.last as Exclude<item, null>).addTime;
    return { last, sendTime };
  };

  if (isSel(node)) {
    const data = node;
    const { last, sendTime } = getLastAndSendTime(data);
    const mediaList = null;
    return { type: "sel", sendTime, currentBook, mediaList, data, last };
  } else {
    const data = scanObject(node, 2);
    const { last, sendTime } = getLastAndSendTime(data);
    const videoId = (data.excerptPic as excerptPic_video)?.video;
    const mediaList = [];
    const mediaIds = node.mediaList?.split("-").filter((id) => id !== videoId);
    if (mediaIds && mediaIds.length > 1) {
      for (const id of mediaIds) {
        if (!id) continue; // escape empty string
        const mediaData = Database.sharedInstance()
          .getMediaByHash(id)
          ?.base64Encoding();
        // only export png, cannot find way to process stroke properly for now
        if (mediaData && mediaData.startsWith("iVBORw0K"))
          mediaList.push({ id, data: mediaData });
      }
    }
    return { type: "note", sendTime, currentBook, mediaList, data, last };
  }
};

const MNMark: MNMark = "<!--MN-->\n";

export const stringify = <T extends node>(
  node: T,
  rec: PopupRecorder,
  currentBook?: MbBook,
): string => {
  return MNMark + JSON.stringify(process(node, rec, currentBook));
};

const isSel = (node: node): node is selection =>
  typeof (node as selection).sel === "string";
