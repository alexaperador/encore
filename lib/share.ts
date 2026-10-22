import { Share } from "react-native";
import { i18n } from "./i18n";
import type { Concert } from "./concerts";

export const shareConcert = async (concert: Concert) => {
    const locale = i18n.locale.startsWith("en") ? "en-US" : "es-ES";
    const date = concert.date
        ? new Date(`${concert.date}T00:00:00`).toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : i18n.t("share.dateToBeConfirmed");
    const location = [concert.venue, concert.city]
        .filter(Boolean)
        .join(" · ");
    const details = [date, concert.hour, location]
        .filter(Boolean)
        .join("\n");
    const appLink = `encore://concert?data=${encodeURIComponent(JSON.stringify(concert))}`;
    const message = [
        `\uD83C\uDFB6 ${concert.title}`,
        details,
        concert.ticketUrl ? `${i18n.t("share.tickets")}: ${concert.ticketUrl}` : null,
        `${i18n.t("share.openInEncore")}: ${appLink}`,
    ].filter(Boolean).join("\n\n");

    await Share.share({
        title: concert.title,
        message,
        url: appLink,
    });
};
