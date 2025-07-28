import { AppProps } from '../src/app.js';
export const appProps: AppProps = {
    onApprove: (message) => {
        //TODO policy to approve unapproved on localhost
        const { specs } = message;
        return specs;
    }
};
