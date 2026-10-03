import { FunctionComponent, ReactElement } from 'react'
import Slider from 'react-slick'
import styled from 'styled-components'

import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const Overlay = styled.div`
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    .slick-dots li button:before {
        color: ${(props) => props.theme.colors.border};
    }

    .card {
      display: flex;
      width: 100%;
      height: 100%;
      .item {
          background-color: blue;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin: 10px;
      }
    }
    @media (min-width: 650px) {
      display: none;
    }  
`

const SliderPlayer: FunctionComponent = (): ReactElement => {

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    }

    return (
        <Overlay>
            <Slider {...settings}>
                <div className="card">
                    <div className="item">
                        <h3>1</h3>
                    </div>
                </div>
                <div className="card">
                    <div className="item">
                        <h3>2</h3>
                    </div>
                </div>
                <div className="card">
                    <div className="item">
                        <h3>3</h3>
                    </div>
                </div>
            </Slider>
        </Overlay>
    )
}

export { SliderPlayer }