import { InteractiveDocument } from "schema";
import { CustomWindow, Iframe } from "./iframe.js";


export interface Props {
}

export function Editor(props: Props) {
    const page: InteractiveDocument = {
        title: "Sample Page",
        layout: {
            css: "",
        },
        dataLoaders: [],
        groups: [],
        variables: [],
    };
    const stateRef = React.useRef<CustomWindow>(null);
    return (
        <div>
            <div>
                Hello world
            </div>
            <div>
                <Iframe
                    page={page}
                    stateRef={stateRef}
                />
            </div>
        </div>
    );
}
