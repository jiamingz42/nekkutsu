import { Component } from "@angular/core";

export interface Track {
    name: string;
    path: string;
}

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomePage {
    playlist: Track[] = [
        {
            name: "foo",
            path: "./assets/mp3/foo.mp3"
        }
    ]
}