import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export default class GoogleApi {
  private scopes: string[] = ['https://www.googleapis.com/auth/calendar']
  private tokenDir: string = (process.env.TOKEN_DIR || path.resolve()) + '/credentials/'
  private tokenFile: string = process.env.TOKEN_FILE || 'token.json'
  private credentialsFile: string = process.env.CREDENTIALS_FILE || 'auth.json'
  private auth: OAuth2Client = new google.auth.OAuth2() 

  public calendar = google.calendar({ version: 'v3', auth: this.auth })

  constructor () {
    this.authorize()
  }

  private authorize() {
    const credentials: any = fs.readFileSync(this.tokenDir + this.credentialsFile)
    const { client_secret, client_id, redirect_uris } = JSON.parse(credentials).web

    this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    const token = fs.readFileSync(this.tokenDir + this.tokenFile)

    if (!token) return this.getAccessToken()
    this.auth.setCredentials(JSON.parse(token.toString()))
  }

  private getAccessToken() {
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes
    })
    console.log('Authorize this app by visiting this url:' + authUrl)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('Enter the code from page:', code => {
      rl.close()
      this.auth.getToken(code, (err, token: any) => {
        if (err) return console.error('Error retrieving access token', err)
        this.auth.setCredentials(token)
        fs.writeFile(this.tokenDir + this.tokenFile, JSON.stringify(token), (err) => {
          if (err) return console.error(err)
          console.log('Token stored!')
        })
      })
    })

  }
}

