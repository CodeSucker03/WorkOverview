import type { AxiosResponse } from "axios";
import HTML from "sap/ui/core/HTML";

class Files {
  public getFileMetadata(response: AxiosResponse<Blob>) {
    const { headers, data } = response;

    const disposition = <string>headers["content-disposition"];
    const type = <string>headers["content-type"];

    const match = /filename="(.+)"/.exec(disposition)?.[1];

    if (!match) {
      throw new Error("Filename is not valid");
    }

    const name = match.replace(/['"]/g, "").trim();

    const blob = new Blob([data], { type });

    const url = window.URL.createObjectURL(blob);

    return { url, name };
  }

  public createDownloadLink(url: string, name: string) {
    const anchor = new HTML({
      content: `<a id="downloadFile" style="visibility: hidden" target="_blank" rel="noopener noreferrer" href="${url}" download="${name}"></a>`,
      preferDOM: false,
      afterRendering: () => {
        jQuery("#downloadFile")[0].click();
        window.URL.revokeObjectURL(url);
        anchor.destroy();
      },
    });

    return anchor;
  }

  public convertFileToBase64(file: File | Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        // console.log(reader.result?.toString());
        const content = <string>reader.result?.toString().replace(/^data:.+;base64,/, "");

        resolve(content);
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  public convertBlobToText(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const content = <string>reader.result?.toString() || "";
        resolve(content);
      };

      reader.onerror = reject;

      reader.readAsText(blob);
    });
  }
}

export default new Files();
