import { IntegrationBase } from "@budibase/types"
import fetch from "node-fetch"
import * as msal from "@azure/msal-node";

interface Query {
  method: string
  body?: string
  headers?: { [key: string]: string }
}

class CustomIntegration implements IntegrationBase {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly tenantId: string



  constructor(config: { clientId: string, clientSecret: string, tenantId: string }) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.tenantId = config.tenantId
  }


  async read(query: { json: object } ) {

    const clientConfig = {
      auth: {
        clientId: this.clientId,
        authority: "https://login.microsoftonline.com/" + this.tenantId,
        clientSecret: this.clientSecret
      },
    };

    async function getToken() {
      const clientApplication = new msal.ConfidentialClientApplication(
        clientConfig,
      );

      const clientCredentialRequest = {
        scopes: ["https://analysis.windows.net/powerbi/api/.default"],
      };
      return clientApplication.acquireTokenByClientCredential(clientCredentialRequest);

    }

    let accessTokenResponse = await getToken()
    let accessToken = accessTokenResponse!.accessToken

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    };


    // Make the POST request to generate the embed token
    let embedToken = await fetch('https://api.powerbi.com/v1.0/myorg/GenerateToken', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query.json)
    }).then(async function (res) {
      if (!res.ok) {
        const errorResponse = await res.text();
        throw new Error(`Network response was not ok: TEST ` + errorResponse);
      }
      return res.json(); // Parse JSON response
    })
      // then print JSON data that was parsed
      .then(function (data) {
        return data;
      });
    embedToken["servicePrincipalAccessToken"]=accessToken
    return embedToken
  }

  async timer(query: { timer: number }){
    await new Promise(r => setTimeout(r, query.timer));
    return 'Complete'

  }
}

export default CustomIntegration
