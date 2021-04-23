import { Component, OnInit } from '@angular/core';
import { Filesystem } from '@ionic-enterprise/filesystem/ngx';


@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss'],
})
export class TrackComponent implements OnInit {
  constructor(private filesystem: Filesystem) {}

  ngOnInit() {
  }
}
