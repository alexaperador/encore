import { Share } from "react-native";
import { Concert } from "./concerts";

export const shareConcert = async (concert: Concert) => {
    const date = concert.date
        ? new Date(`${concert.date}T00:00:00`).toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "Fecha por confirmar";
    const location = [concert.venue, concert.city]
        .filter(Boolean)
        .join(" · ");
    const details = [date, concert.hour, location]
        .filter(Boolean)
        .join("\n");
    const appLink = `encore://concert?data=${encodeURIComponent(JSON.stringify(concert))}`;
    const message = `\uD83C\uDFB6 ${concert.title}\n${details}${concert.ticketUrl ? `\n\nEntradas: ${concert.ticketUrl}` : ""}\n\nVer en Encore: ${appLink}`;

    await Share.share({
        title: concert.title,
        message,
        url: appLink,
    });
};