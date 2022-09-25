import qs from "qs";
import fetch from "node-fetch";

export const get0xQuote = async (
    sellToken: string,
    buyToken: string,
    sellAmount: string
) => {
    const params = {
        sellToken: sellToken,
        buyToken: buyToken,
        sellAmount: sellAmount,
    }

    const response = await fetch(
        `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    );


    const resp = await response.json()

    return resp;
} 