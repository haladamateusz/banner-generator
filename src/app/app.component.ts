import { AfterViewInit, Component, ElementRef, inject, NgZone, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import {
  Application,
  Assets,
  FederatedPointerEvent,
  FillGradient,
  Graphics,
  Sprite,
  TexturePool
} from 'pixi.js';
import { MatIcon } from '@angular/material/icon';
import { MatMiniFabButton } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatIcon,
    MatMiniFabButton
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'banner-generator';

  fileName = '';

  image: Sprite | null = null;

  dragging = false;

  @ViewChild('imageContainer') private readonly container!: ElementRef;

  private readonly application: Application = new Application();

  private readonly ngZone: NgZone = inject(NgZone);

  async ngAfterViewInit(): Promise<void> {
    TexturePool.textureOptions.scaleMode = 'nearest';

    await this.ngZone.runOutsideAngular(async (): Promise<void> => {
      await this.application.init({
        antialias: true,
        autoDensity: true,
        resolution: 2,
        background: 'fafafa',
        width: 500,
        height: 500
      });

      this.container.nativeElement.appendChild(this.application.canvas);

      const gradientFill = new FillGradient(0, 0, 500, 500);
      gradientFill.addColorStop(0, 'red');
      gradientFill.addColorStop(0.5, 'red');
      gradientFill.addColorStop(0.8, 'transparent');

      const spriteMaskTexture = await Assets.load('sprite-mask.png');
      const spriteMask: Sprite = new Sprite(spriteMaskTexture);

      // change fill to stroke
      const background: Graphics = new Graphics()
        .circle(this.application.screen.width / 2, this.application.screen.height / 2, 400)
        .fill('fafafa');

      const banner: Graphics = new Graphics()
        .circle(this.application.screen.width / 2, this.application.screen.height / 2, 205)
        .stroke({
          width: 80,
          alpha: 1,
          color: 'red'
        });

      banner.zIndex = 3;
      banner.mask = spriteMask;

      this.application.stage.addChild(background);
      this.application.stage.addChild(banner);
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const file: File = target.files[0];

    if (file) {
      this.fileName = file.name;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const texture = await Assets.load(reader.result as string);

        this.image = new Sprite({
          texture,
          x: this.application.screen.width / 2,
          y: this.application.screen.height / 2,
          eventMode: 'static',
          anchor: 0.5,
          cursor: 'grab',
          scale: 0.25
        });

        this.image.on('pointerdown', this.onDragStart.bind(this));

        this.application.stage.addChild(this.image);
        this.application.stage.eventMode = 'static';
        this.application.stage.hitArea = this.application.screen;
        this.application.stage.on('pointerup', this.onDragEnd.bind(this));
        this.application.stage.on('pointerupoutside', this.onDragEnd.bind(this));
      };
    }
  }

  onDragStart() {
    this.dragging = true;
    this.image!.alpha = 0.5;
    this.application.stage.on('pointermove', this.onDragMove.bind(this));
  }

  onDragMove(event: FederatedPointerEvent): void {
    if (this.dragging) {
      this.image!.parent.toLocal(event.global, this.application.stage, this.image!.position);
    }
  }

  onDragEnd(): void {
    if (this.dragging) {
      this.application.stage.removeListener('pointermove', this.onDragMove);
      this.application.stage.removeEventListener('pointermove', this.onDragStart);
      this.image!.alpha = 1;
      this.dragging = false;
    }
  }
}
