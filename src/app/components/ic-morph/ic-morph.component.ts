declare var mina: any;
import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { of } from 'rxjs';
import { first, delay } from 'rxjs/operators';
import { icMovements } from './ic-morph-from-to';
import * as Snap from 'snapsvg-cjs';

@Component({
  selector: 'ic-morph',
  templateUrl: './ic-morph.component.html',
  styleUrls: ['./ic-morph.component.scss'],
})

export class IcMorphComponent implements OnInit {
  private isEasing: boolean = true;
  private el: HTMLElement;
  private toggled: boolean = false;
  private clickEvtName: string;
  private reverse: boolean;
  private bezierArray: any[];
  private icMovements: object;
  private svg: any;
  private config: any;

  private icons: HTMLElement[];
  private multipleIndex: number = 0;
  private isMoving = false;
  private custSpeed: number;

  @ViewChild('container', { static: true }) private container: ElementRef;
  @Input() speed: number = 200;
  @Input() easingInput: string = 'linear';
  @Input() evtoggle: string = 'click';
  @Input() size: number | string = 32;
  @Input() onLoad: () => void = () => false;
  @Input() onToggle: () => void = () => false;

  constructor() {
    this.icMovements = icMovements;
  }

  ngOnInit() {
    this.el = this.container.nativeElement.firstChild;
    this.icons = this.container.nativeElement.getElementsByTagName('span');
    this.custSpeed = this.speed;
    this.svgInit();
    this.svgIcon(this.icMovements, 0, true);
    if (this.easingInput.indexOf('cubic-bezier') > -1) {
      this.isEasing = false;
      const pos = this.easingInput.substring(this.easingInput.indexOf('(') + 1, this.easingInput.indexOf(')'));
      this.bezierArray = pos.split(',');
      this.bezierArray = this.bezierArray.map(val => {
        return parseFloat(val);
      });
    }
  }

  private svgInit() {
    this.svg = Snap(this.size, this.size);
    this.svg.attr('viewBox', '0 0 64 64');
    this.el.appendChild(this.svg.node);
    this.clickEvtName = ('ontouchstart' in document.documentElement) ? 'touchstart' : 'click';
  }
  private svgIcon(config, i, first?) {
    if (!this.icons[i]) { return; }
    this.toggled = false;
    // icons configuration
    this.config = config[this.icons[i].getAttribute('ic-name')];
    if (this.hasClass(this.el, 'ic-reverse')) { this.reverse = true; }
    if (!this.config) { return; }
    // load external svg
    Snap.load(this.config.url, (e) => {
      const g = e.select('g');
      if (first) {
        this.svg.append(g);
        this.onLoad();
        this._initEvents();
        if (this.reverse) {
          this.toggle();
        }
      } else {
        this.svg.remove();
        this.svgInit();
        this.svg.append(g);
      }
    });
  }

  private _initEvents() {
    const toggleFn = (ev) => {
      if (((ev.type.toLowerCase() === 'mouseover' || ev.type.toLowerCase() === 'mouseout') && this.isMouseLeaveOrEnter(ev, this)) || ev.type.toLowerCase() === this.clickEvtName) {
        this.toggle(true);
        this.onToggle();
      }
    };

    if (this.evtoggle === 'mouseover') {
      this.el.addEventListener('mouseover', toggleFn);
      this.el.addEventListener('mouseout', toggleFn);
    } else {
      this.el.addEventListener(this.clickEvtName, toggleFn);
    }
  }

  private toggle(motion?: boolean) {
    if (!this.config.animation || this.isMoving) { return; }
    let isIcChg = false;
    this.isMoving = true;
    this.config.animation.forEach(aniObj => {
      // toggled가 true일 경우 path는 from으로 변함
      const el = this.svg.select(aniObj.el);
      const animProp = this.toggled ? aniObj.animProperties.from : aniObj.animProperties.to;
      const timeout = motion && animProp.delayFactor ? animProp.delayFactor : 0;
      const between = aniObj.animProperties.between;
      const startFlag = this.toggled;

      let index = this.toggled && between ? between.length - 1 : 0;
      const val = between ? between[index].val : animProp.val;

      if (animProp.before) {
        el.attr(JSON.parse(animProp.before));
      }
      if (motion) {
        const icAnimate = () => {
          this.chgSpeed(between);
          el.animate(JSON.parse(val), this.custSpeed, this.isEasing ? mina[this.easingInput] : this.custBezier(), () => {
            if (between) { // from과 to 사이에 자연스럽게 보여주기 위한
              if (startFlag && index === 0 || !startFlag && index >= between.length - 1) {
                this.pathChg(el, animProp, between);
                isIcChg = true;
              } else {
                index = startFlag ? index - 1 : index + 1;
                this.funcDelay(icAnimate, timeout * this.custSpeed);
              }
            } else if (!isIcChg) {
              this.pathChg(el, animProp);
              isIcChg = true;
            }

            if (animProp.after) {
              el.attr(JSON.parse(animProp.after));
            }
            if (animProp.animAfter) {
              el.animate(JSON.parse(animProp.animAfter), this.custSpeed, this.isEasing ? mina[this.easingInput] : this.custBezier());
            }
          });
        };
        this.funcDelay(icAnimate, timeout * this.custSpeed);
      } else {
        el.attr(JSON.parse(val));
      }
    });
    this.toggled = !this.toggled;
  }

  private funcDelay(func: () => void, time: number) {
    of(null).pipe(
      first(),
      delay(time)
    ).subscribe(() => func());
  }

  private chgSpeed(between?) {
    this.custSpeed = between ? this.speed / (between.length + 1) : this.speed;
  }

  private pathChg(el, animProp, between?) {
    this.chgSpeed(between);
    el.animate(JSON.parse(animProp.val), this.custSpeed, this.isEasing ? mina[this.easingInput] : this.custBezier(), () => {
      if (this.icons.length > 1) {
        this.multipleIndex += 1;
        this.multipleIndex = this.multipleIndex > this.icons.length - 1 ? 0 : this.multipleIndex;
        this.svgIcon(this.icMovements, this.multipleIndex);
      }
      if (between) { this.isMoving = false; }
    });
    if (!between) { this.isMoving = false; }
  }

  private custBezier() {
    if (this.bezierArray.length !== 4) { return; }
    return this.bezier(this.bezierArray[0], this.bezierArray[1], this.bezierArray[2], this.bezierArray[3]);
  }

  private hasClass(el, className) {
    return 'classList' in document.documentElement ? el.classList.contains(className) : this.classReg(className).test(el.className);
  }

  private classReg(className: string) {
    return new RegExp('(^|\\s+)' + className + '(\\s+|$)');
  }

  private isMouseLeaveOrEnter(e, handler) {
    if (e.type !== 'mouseout' && e.type !== 'mouseover') { return false; }
    let reltg = e.relatedTarget ? e.relatedTarget : e.type === 'mouseout' ? e.toElement : e.fromElement;
    while (reltg && reltg !== handler) { reltg = reltg.parentNode; }
    return (reltg !== handler);
  }

  private bezier(x1, y1, x2, y2) {
    const epsilon = (1000 / 60 / this.custSpeed) / 4;
    const curveX = (t) => {
      const v = 1 - t;
      return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
    };

    const curveY = (t) => {
      const v = 1 - t;
      return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
    };

    const derivativeCurveX = (t) => {
      const v = 1 - t;
      return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (- t * t * t + 2 * v * t) * x2;
    };

    return (t) => {
      const x = t;
      let t0;
      let t1;
      let t2;
      let x2;
      let d2;
      let i;

      // First try a few iterations of Newton's method -- normally very fast.
      for (t2 = x, i = 0; i < 8; i++) {
        x2 = curveX(t2) - x;
        if (Math.abs(x2) < epsilon) { return curveY(t2); }
        d2 = derivativeCurveX(t2);
        if (Math.abs(d2) < 1e-6) { break; }
        t2 = t2 - x2 / d2;
      }

      t0 = 0, t1 = 1, t2 = x;

      if (t2 < t0) { return curveY(t0); }
      if (t2 > t1) { return curveY(t1); }

      // Fallback to the bisection method for reliability.
      while (t0 < t1) {
        x2 = curveX(t2);
        if (Math.abs(x2 - x) < epsilon) { return curveY(t2); }
        if (x > x2) {
          t0 = t2;
        } else {
          t1 = t2;
        }
        t2 = (t1 - t0) * .5 + t0;
      }
      // Failure
      return curveY(t2);
    };
  }
}
