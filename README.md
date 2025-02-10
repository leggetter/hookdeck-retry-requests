# Retry Hookdeck Requests

This project provides a simple script to retry Hookdeck requests. For the moment, it filters for requests that have resulted in failed transformations.

This uses the [Retry a Request endpoint](https://hookdeck.com/docs/api#retry-a-request#retry-a-request).

## Usage

1. Clone the repo:
   ```sh
   git clone https://github.com/leggetter/hookdeck-retry-requests.git
   ```
2. Add your Hookdeck Project API Key (Hookdeck dashboard -> Settings -> Secrets) to the `.env` file. See `.env.example` as an example.
3. Install dependencies:
   ```sh
   npm i
   ```
4. Run the script:
   ```sh
   npm run dev
   ```

## License

[MIT](LICENSE)
