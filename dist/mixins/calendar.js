import calendar from '../lib/calendarinit'

const bind = (fn, ctx) => {
    return (...args) => {
        return args.length ? fn.apply(ctx, args) : fn.call(ctx)
    }
}

// 获取手指触摸点坐标
const getTouchPosition = (e) => {
    const touches = e.touches[0] || e.changedTouches[0]
    return {
        x: touches.pageX,
        y: touches.pageY,
    }
}

// 获取元素旋转属性
const getTransform = (translate, isH) => `transform: translate3d(${isH ? translate : 0}%, ${isH ? 0 : translate}%, 0)`

// 判断两个日期是否在同一天
const isSameDate = (a, b) => {
    const prev = new Date(a)
    const next = new Date(b)
    return prev.getFullYear() === next.getFullYear() && prev.getMonth() === next.getMonth() && prev.getDate() === next.getDate()
}

export default Behavior({
    data: {
        formatValue: '',
        currentValues: []
    },
    methods: {
        merge (opts = {}, fns = this.fns) {
            const options = Object.assign({}, opts)
        
            for (const key in options) {
                if (options.hasOwnProperty(key) && typeof options[key] === 'function') {
                    fns[key] = bind(options[key], this)
                    // delete options[key]
                }
            }
        
            return options
        },
        /**
         * 关闭日历
         */
        close() {
            this.setData({ visible: false })

            if (typeof this.fns.onClose === 'function') {
                this.fns.onClose.call(this)
            }
        },
        /**
         * 更新视图
         */
        updateView () {
            if (!this.data.months) return
            this.setMarkers(this.data.months)
            let currentValues = []
            let minDate = this.data.minDate ? new Date(this.data.minDate).getTime() : null
            let maxDate = this.data.maxDate ? new Date(this.data.maxDate).getTime() : null
            let today = new Date().setHours(0, 0, 0, 0)
            if (this.data.value && this.data.value.length) {
                for (let i = 0; i < this.data.value.length; i++) {
                    currentValues.push(new Date(this.data.value[i]).setHours(0, 0, 0, 0))
                }
            }
            let months = this.data.months
            months.forEach(m => {
                if (!m.items) return
                m.items.forEach(col => {
                    col.forEach(e => {
                        let type = e.type
                        if (!type.empty) {
                            let dayDate = new Date(e.datetime)
                            // Today
                            if (dayDate === today) type.today = true

                            // Selected
                            if (currentValues.indexOf(dayDate) >= 0) type.selected = true

                            // Weekend
                            if (this.data.weekendDays.indexOf(col - 1) >= 0) {
                                type.weekend = true
                            }
                            // Disabled
                            if ((minDate && dayDate < minDate) || (maxDate && dayDate > maxDate)) {
                                type.disabled = true
                            }
                        }
                    })
                })
            })
            this.setData({
                months
            })
        },
        /**
         * 初始化
         */
        init() {
            const weeks = this.setWeekHeader()
            const months = this.setMonthsHTML()
            const monthsTranslate = this.setMonthsTranslate()

            if (typeof this.fns.onMonthAdd === 'function') {
                months.forEach((month) => this.fns.onMonthAdd.call(this, month))
            }
            this.setMarkers(months)
            this.setData({ weeks, months, monthsTranslate, wrapperTranslate: '' })
            this.setData({...this.updateCurrentMonthYear()})
        },
        setMarkers (months, shouldUpdate = false) {
            if (!months || !months.length) return
            this.__setMarkers(months)
            if (shouldUpdate) this.setData({months})
        },
        __setMarkers (months) {
            for (let i = 0; i < this.data.markers.length; i++) {
                const marker = this.data.markers[i]
                const year = Number(marker.year)
                const month = Number(marker.month)
                const days = marker.days
                months.forEach(m => {
                    if (!m.items) return
                    m.items.forEach(col => {
                        col.forEach(e => {
                            let ey = e.year
                            let em = e.month
                            if (ey === year && em + 1 === month) {
                                if (days.findIndex(d => Number(d) === e.day) !== -1) {
                                    e.marker = true
                                } else {
                                    e.marker = false
                                }
                            } else {
                                e.marker = false
                            }
                        })
                    })
                })
            }
        },
        /**
         * 设置月份的位置信息
         * @param {Number} translate
         */
        setMonthsTranslate(translate = this.monthsTranslate) {
            const prevMonthTranslate = -(translate + 1) * 100
            const currentMonthTranslate = -translate * 100
            const nextMonthTranslate = -(translate - 1) * 100

            return [
                getTransform(prevMonthTranslate, this.isH),
                getTransform(currentMonthTranslate, this.isH),
                getTransform(nextMonthTranslate, this.isH),
            ]
        },
        /**
         * 更新当前年月
         * @param {String} dir 方向
         */
        updateCurrentMonthYear(dir) {
            const { months, monthNames } = this.data
            if (typeof dir === 'undefined') {
                const currentMonth = parseInt(months[1].month, 10)
                const currentYear = parseInt(months[1].year, 10)
                const currentHeight = months[1].height
                const currentMonthName = monthNames[currentMonth]
                this.triggerEvent('month-change', {
                    currentMonth,
                    currentYear,
                    currentMonthName
                })
                if (typeof this.fns.onMonthChange === 'function') {
                    this.fns.onMonthChange.call(this, currentYear, currentMonth, currentMonthName)
                }
                return {
                    currentMonth,
                    currentYear,
                    currentHeight,
                    currentMonthName,
                }
            }

            const currentMonth = parseInt(months[dir === 'next' ? (months.length - 1) : 0].month, 10)
            const currentYear = parseInt(months[dir === 'next' ? (months.length - 1) : 0].year, 10)
            const currentHeight = months[dir === 'next' ? (months.length - 1) : 0].height
            const currentMonthName = monthNames[currentMonth]
            this.triggerEvent('month-change', {
                currentMonth,
                currentYear,
                currentMonthName
            })
            if (typeof this.fns.onMonthChange === 'function') {
                this.fns.onMonthChange.call(this, currentYear, currentMonth, currentMonthName)
            }
            return {
                currentMonth,
                currentYear,
                currentHeight,
                currentMonthName,
            }
        },
        /**
         * 手指触摸动作开始
         * @param {Object} e 事件对象
         */
        onTouchStart(e) {
            if (!this.data.touchMove || this.isMoved || this.isRendered) return

            this.start = getTouchPosition(e)
            this.move = {}
            this.touchesDiff = 0
            this.allowItemClick = true
            this.isMoved = false
        },
        /**
         * 手指触摸后移动
         * @param {Object} e 事件对象
         */
        onTouchMove(e) {
            if (!this.data.touchMove || this.isRendered) return

            this.allowItemClick = false

            if (!this.isMoved) {
                this.isMoved = true
            }
            this.move = getTouchPosition(e)
            this.touchesDiff = this.isH ? this.move.x - this.start.x : this.move.y - this.start.y
            this.setData({ swiping: true })
            if (!this.data.isIos) {
                this.move = getTouchPosition(e)
                this.touchesDiff = this.isH ? this.move.x - this.start.x : this.move.y - this.start.y
            } else {
                const query = wx.createSelectorQuery().in(this)
                query.select(`.i-calendar-months-content`).boundingClientRect((rect) => {
                    // 由于 boundingClientRect 为异步方法，某些情况下其回调函数在 onTouchEnd 之后触发，导致 wrapperTranslate 计算错误
                    // 所以判断 this.isMoved = false 时阻止回调函数的执行
                    if (!rect || !this.isMoved) return

                    this.move = getTouchPosition(e)
                    this.touchesDiff = this.isH ? this.move.x - this.start.x : this.move.y - this.start.y

                    const { width, height } = rect
                    const percentage = this.touchesDiff / (this.isH ? width : height)
                    const currentTranslate = (this.monthsTranslate + percentage) * 100
                    const transform = getTransform(currentTranslate, this.isH)

                    this.setData({
                        wrapperTranslate: `transition-duration: 0s; ${transform}`,
                    })
                })
                query.exec()
            }
        },
        /**
         * 手指触摸动作结束
         */
        onTouchEnd() {
            if (!this.data.touchMove || !this.isMoved || this.isRendered) return

            this.isMoved = false
            this.setData({ swiping: false })

            if (Math.abs(this.touchesDiff) < 30) {
                this.resetMonth()
            } else if (this.touchesDiff >= 30) {
                this.prevMonth()
            } else {
                this.nextMonth()
            }

            // Allow click
            setTimeout(() => (this.allowItemClick = true), 100)
        },
        /**
         * 日期的点击事件
         * @param {Object} e 事件对象
         */
        onDayClick(e) {
            if (this.data.range) {
                this.onDayClick4Range(e)
                return
            }
            if (e.currentTarget.dataset.empty) return
            if (this.allowItemClick) {
                const dataset = e.currentTarget.dataset
                const dateYear = dataset.year
                const dateMonth = dataset.month
                const dateDay = dataset.day
                const dateType = dataset.type

                if (dateType.selected && !this.data.multiple) return
                if (dateType.disabled) return
                if (dateType.next) this.nextMonth()
                if (dateType.prev) this.prevMonth()

                if (typeof this.fns.onDayClick === 'function') {
                    this.fns.onDayClick.call(this, dateYear, dateMonth, dateDay)
                }

                this.addValue(new Date(dateYear, dateMonth, dateDay).getTime())

                if (this.data.closeOnSelect && !this.data.multiple) {
                    this.close()
                }
            }
        },
        onDayClick4Range (e) {
            if (e.currentTarget.dataset.empty) return
            const dataset = e.currentTarget.dataset
            const datetime = dataset.datetime
            const type = dataset.type
            if (type.disabled) return
            let startDate = this.data.startDate
            let endDate = this.data.endDate
            let d = datetime
            if (startDate && !endDate && startDate.datetime === datetime) {
                startDate = null
            } else if (endDate && !startDate && endDate.datetime === datetime) {
                endDate = null
            } else if (!startDate) {
                startDate = d
            } else if (startDate && !endDate) {
                endDate = d
            } else if (startDate && endDate && (startDate.datetime === datetime || endDate.datetime === datetime)) {
                // 若选中的时间等于起始时间或结束时间，那么结束时间置空，并设置起始时间
                if (startDate.datetime === datetime) {
                    startDate = endDate
                    endDate = null
                } else {
                    endDate = null
                }
                
            } else {
                // 如果起始时间和结束时间都选择，那么情况当前时间并设置为起始时间
                startDate = d
                endDate = null
            }      
            // 若结束时间小于起始时间，进行交换
            if (startDate && endDate && endDate < startDate) {
                let t = endDate
                endDate = startDate
                startDate = t
            }
            let formatStart = startDate ? this.formatDate(startDate) : ''
            let formatEnd = endDate ? this.formatDate(endDate) : ''
            this.setData({
                startDate,
                endDate,
                formatValue: `${formatStart && formatEnd ? formatStart + ' - ' : formatStart}${formatEnd}`
            })
        },
        /**
         * 重置月份的位置信息
         */
        resetMonth() {
            const translate = this.monthsTranslate * 100
            const transform = getTransform(translate, this.isH)

            this.setData({
                wrapperTranslate: `transition-duration: 0s; ${transform}`,
            })
        },
        /**
         * 设置年月
         * @param {String} year 年份
         * @param {String} month 月份
         */
        setYearMonth(year = this.data.currentYear, month = this.data.currentMonth) {
            const { months, monthsTranslate, maxDate, minDate, currentYear, currentMonth } = this.data
            const targetDate = year < currentYear ? new Date(year, month + 1, -1).getTime() : new Date(year, month).getTime()

            // 判断是否存在最大日期
            if (maxDate && targetDate > new Date(maxDate).getTime()) return

            // 判断是否存在最小日期
            if (minDate && targetDate < new Date(minDate).getTime()) return

            const currentDate = new Date(currentYear, currentMonth).getTime()
            const dir = targetDate > currentDate ? 'next' : 'prev'
            const newMonthHTML = this.monthHTML(new Date(year, month))

            const prevTranslate = this.monthsTranslate = this.monthsTranslate || 0

            if (targetDate > currentDate) {
                this.monthsTranslate = this.monthsTranslate - 1

                const translate = -(prevTranslate - 1) * 100
                const nextMonthTranslate = getTransform(translate, this.isH)
                const newMonths = [months[1], months[2], newMonthHTML]
                this.setMarkers(newMonths)
                this.setData({
                    months: newMonths,
                    monthsTranslate: [monthsTranslate[1], monthsTranslate[2], nextMonthTranslate],
                })
            } else {
                this.monthsTranslate = this.monthsTranslate + 1

                const translate = -(prevTranslate + 1) * 100
                const prevMonthTranslate = getTransform(translate, this.isH)
                const newMonths = [newMonthHTML, months[0], months[1]]
                this.setMarkers(newMonths)
                this.setData({
                    months: newMonths,
                    monthsTranslate: [prevMonthTranslate, monthsTranslate[0], monthsTranslate[1]],
                })
            }
            

            this.onMonthChangeStart(dir)

            const transform = getTransform(this.monthsTranslate * 100, this.isH)
            const duration = this.data.animate ? .3 : 0
            const wrapperTranslate = `transition-duration: ${duration}s; ${transform}`

            this.setData({
                wrapperTranslate,
            })

            setTimeout(() => this.onMonthChangeEnd(dir, true), duration)
        },
        /**
         * 下一年
         */
        nextYear() {
            this.setYearMonth(this.data.currentYear + 1)
        },
        /**
         * 上一年
         */
        prevYear() {
            this.setYearMonth(this.data.currentYear - 1)
        },
        /**
         * 下一月
         */
        nextMonth() {
            const { months, monthsTranslate, maxDate, currentMonth } = this.data
            const nextMonth = parseInt(months[months.length - 1].month, 10)
            const nextYear = parseInt(months[months.length - 1].year, 10)
            const nextDate = new Date(nextYear, nextMonth)
            const nextDateTime = nextDate.getTime()
            // 判断是否存在最大日期
            if (maxDate && nextDateTime > new Date(maxDate).getTime()) {
                return this.resetMonth()
            }

            this.monthsTranslate = this.monthsTranslate - 1

            if (nextMonth === currentMonth) {
                const translate = -(this.monthsTranslate) * 100
                const nextMonthHTML = this.monthHTML(nextDateTime, 'next')
                const nextMonthTranslate = getTransform(translate, this.isH)
                const newMonths = [this.data.months[1], this.data.months[2], nextMonthHTML]
                this.setMarkers(newMonths)
                this.setData({
                    months: newMonths,
                    monthsTranslate: [monthsTranslate[1], monthsTranslate[2], nextMonthTranslate],
                })

                if (typeof this.fns.onMonthAdd === 'function') {
                    this.fns.onMonthAdd.call(this, months[months.length - 1])
                }
            } else {
                this.setMarkers(this.data.months, true)
            }

            this.onMonthChangeStart('next')

            const transform = getTransform(this.monthsTranslate * 100, this.isH)
            const duration = this.data.animate ? .3 : 0
            const wrapperTranslate = `transition-duration: ${duration}s; ${transform}`

            this.setData({
                wrapperTranslate,
            })

            setTimeout(() => this.onMonthChangeEnd('next'), duration)
        },
        /**
         * 上一月
         */
        prevMonth() {
            const { months, monthsTranslate, minDate, currentMonth } = this.data
            const prevMonth = parseInt(months[0].month, 10)
            const prevYear = parseInt(months[0].year, 10)
            const prevDate = new Date(prevYear, prevMonth + 1, -1)
            const prevDateTime = prevDate.getTime()

            // 判断是否存在最小日期
            if (minDate && prevDateTime < new Date(minDate).getTime()) {
                return this.resetMonth()
            }

            this.monthsTranslate = this.monthsTranslate + 1

            if (prevMonth === currentMonth) {
                const translate = -(this.monthsTranslate) * 100
                const prevMonthHTML = this.monthHTML(prevDateTime, 'prev')
                const prevMonthTranslate = getTransform(translate, this.isH)
                const newMonths = [prevMonthHTML, this.data.months[0], this.data.months[1]]
                this.setMarkers(newMonths)
                this.setData({
                    months: newMonths,
                    monthsTranslate: [prevMonthTranslate, monthsTranslate[0], monthsTranslate[1]],
                })

                if (typeof this.fns.onMonthAdd === 'function') {
                    this.fns.onMonthAdd.call(this, months[0])
                }
            } else {
                this.setMarkers(this.data.months, true)
            }

            this.onMonthChangeStart('prev')

            const transform = getTransform(this.monthsTranslate * 100, this.isH)
            const duration = this.data.animate ? .3 : 0
            const wrapperTranslate = `transition-duration: ${duration}s; ${transform}`

            this.setData({
                wrapperTranslate,
            })

            setTimeout(() => this.onMonthChangeEnd('prev'), duration)
        },
        /**
         * 月份变化开始时的回调函数
         * @param {String} dir 方向
         */
        onMonthChangeStart(dir) {
            const params = this.updateCurrentMonthYear(dir)

            this.setData(params)

            if (typeof this.fns.onMonthYearChangeStart === 'function') {
                this.fns.onMonthYearChangeStart.call(this, params.currentYear, params.currentMonth)
            }
        },
        /**
         * 月份变化完成时的回调函数
         * @param {String} dir 方向
         * @param {Boolean} rebuildBoth 重置
         */
        onMonthChangeEnd(dir = 'next', rebuildBoth = false) {
            const { currentYear, currentMonth } = this.data
            let nextMonthHTML, prevMonthHTML, newMonthHTML, months = [...this.data.months]

            if (!rebuildBoth) {
                newMonthHTML = this.monthHTML(new Date(currentYear, currentMonth), dir)
                if (dir === 'next') {
                    months = [months[1], months[2], newMonthHTML]
                } else if (dir === 'prev') {
                    months = [newMonthHTML, months[0], months[1]]
                }
            } else {
                prevMonthHTML = this.monthHTML(new Date(currentYear, currentMonth), 'prev')
                nextMonthHTML = this.monthHTML(new Date(currentYear, currentMonth), 'next')
                months = [prevMonthHTML, months[dir === 'next' ? months.length - 1 : 0], nextMonthHTML]
            }

            const monthsTranslate = this.setMonthsTranslate(this.monthsTranslate)

            this.isRendered = true
            this.setMarkers(months)
            this.setData({ months, monthsTranslate })
            this.isRendered = false

            if (typeof this.fns.onMonthAdd === 'function') {
                this.fns.onMonthAdd.call(this, dir === 'next' ? months[months.length - 1] : months[0])
            }

            if (typeof this.fns.onMonthYearChangeEnd === 'function') {
                this.fns.onMonthYearChangeEnd.call(this, currentYear, currentMonth)
            }
        },
        /**
         * 设置星期
         */
        setWeekHeader() {
            const { weekHeader, firstDay, dayNamesShort, weekendDays } = this.data
            const weeks = []

            if (weekHeader) {
                for (let i = 0; i < 7; i++) {
                    const weekDayIndex = (i + firstDay > 6) ? (i - 7 + firstDay) : (i + firstDay)
                    const dayName = dayNamesShort[weekDayIndex]
                    const weekend = weekendDays.indexOf(weekDayIndex) >= 0

                    weeks.push({
                        weekend,
                        dayName,
                    })
                }
            }

            return weeks
        },
        /**
         * 判断日期是否存在
         */
        daysInMonth(date) {
            const d = new Date(date)
            return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
        },
        /**
         * 设置月份数据
         */
        monthHTML(date, offset) {
            date = new Date(date)
            let year = date.getFullYear(),
                month = date.getMonth(),
                time = date.getTime()

            const monthHTML = {
                year,
                month,
                time,
                items: [],
            }

            if (offset === `next`) {
                if (month === 11) date = new Date(year + 1, 0)
                else date = new Date(year, month + 1, 1)
            }

            if (offset === `prev`) {
                if (month === 0) date = new Date(year - 1, 11)
                else date = new Date(year, month - 1, 1)
            }

            if (offset === `next` || offset === `prev`) {
                month = date.getMonth()
                year = date.getFullYear()
                time = date.getTime()
            }

            let daysInPrevMonth = this.daysInMonth(new Date(date.getFullYear(), date.getMonth()).getTime() - 10 * 24 * 60 * 60 * 1000),
                daysInMonth = this.daysInMonth(date),
                firstDayOfMonthIndex = new Date(date.getFullYear(), date.getMonth()).getDay()
            if (firstDayOfMonthIndex === 0) firstDayOfMonthIndex = 7 // 周日
            let rows = Math.ceil((daysInMonth - 7 + firstDayOfMonthIndex) / 7) + 1
            let height = rows * 51 // 51单行高度
            if (this.data.fill) {
                rows = 6
                height = rows * 51
            }

            let dayDate, currentValues = [],
                cols = 7,
                dayIndex = 0 + (this.data.firstDay - 1),
                today = new Date().setHours(0, 0, 0, 0),
                minDate = this.data.minDate ? new Date(this.data.minDate).getTime() : null,
                maxDate = this.data.maxDate ? new Date(this.data.maxDate).getTime() : null

            if (this.data.value && this.data.value.length) {
                for (let i = 0; i < this.data.value.length; i++) {
                    currentValues.push(new Date(this.data.value[i]).setHours(0, 0, 0, 0))
                }
            }

            // 本月中是否存在上一月或下一个的日期
            let hasNextMonth = false
            let hasPrevMonth = false

            for (let i = 1; i <= rows; i++) {
                let rowHTML = []
                let row = i

                for (let j = 1; j <= cols; j++) {
                    let col = j
                    dayIndex++
                    let dayNumber = dayIndex - firstDayOfMonthIndex
                    let type = {}

                    if (dayNumber < 0) {
                        if (this.data.fill) {
                            // prev month
                            if (!hasNextMonth) hasNextMonth = true
                            dayNumber = daysInPrevMonth + dayNumber + 1
                            type.prev = true
                            dayDate = new Date(month - 1 < 0 ? year - 1 : year, month - 1 < 0 ? 11 : month - 1, dayNumber).getTime()
                        } else {
                            type.empty = true
                        }
                    } else {
                        dayNumber = dayNumber + 1
                        if (dayNumber > daysInMonth) {
                            if (this.data.fill) {
                                // next month
                                if (!hasPrevMonth) hasPrevMonth = true
                                dayNumber = dayNumber - daysInMonth
                                type.next = true
                                dayDate = new Date(month + 1 > 11 ? year + 1 : year, month + 1 > 11 ? 0 : month + 1, dayNumber).getTime()
                            } else {
                                type.empty = true
                            } 
                        } else {
                            dayDate = new Date(year, month, dayNumber).getTime()
                        }
                    }
                    if (dayNumber === 1 && !this.data.fill) type.first = true
                    if (col === 1) type.first = true
                    if (dayNumber === daysInMonth && !this.data.fill) type.last = true
                    if (col === 7) type.last = true

                    if (!type.empty) {
                        // Today
                        if (dayDate === today) type.today = true

                        // Selected
                        if (currentValues.indexOf(dayDate) >= 0) type.selected = true

                        // Weekend
                        if (this.data.weekendDays.indexOf(col - 1) >= 0) {
                            type.weekend = true
                        }

                        // Disabled
                        if ((minDate && dayDate < minDate) || (maxDate && dayDate > maxDate)) {
                            type.disabled = true
                        }

                        dayDate = new Date(dayDate)
                        const dayYear = dayDate.getFullYear()
                        const dayMonth = dayDate.getMonth()

                        // 农历
                        let lunar = {}
                        lunar = this.data.lunar ? calendar.solar2lunar(dayYear, dayMonth + 1, dayNumber) : {}
                        rowHTML.push({
                            type,
                            year: dayYear,
                            lunar,
                            empty: false,
                            month: dayMonth,
                            datetime: dayDate.getTime(),
                            day: dayNumber,
                            date: `${dayYear}-${dayMonth + 1}-${dayNumber}`,
                        })
                    } else {
                        rowHTML.push({
                            type,
                            date: '',
                            empty: true,
                            day: '',
                            year: '',
                            month: '',
                            datetime: '',
                            lunar: {}
                        })
                    }
                }
                
                monthHTML.year = year
                monthHTML.height = height
                monthHTML.month = month
                monthHTML.time = time
                monthHTML.prev = hasPrevMonth
                monthHTML.next = hasNextMonth

                monthHTML.items.push(rowHTML)
            }
            if (!this.data.fill) {
                // 查看是否存在空行，存在过滤空行
                let rows = []
                for (let i = 0; i < monthHTML.items.length; ++i) {
                    let flag = false
                    for (let j = 0; j < monthHTML.items[i].length; ++j) {
                        if (!monthHTML.items[i][j].empty) {
                            flag = true
                            break
                        }
                    }
                    if (flag) {
                        rows.push(monthHTML.items[i])
                    }
                }
                height = rows.length * 51
                monthHTML.items = rows
                monthHTML.height = height
            }

            return monthHTML
        },
        /**
         * 设置月份
         */
        setMonthsHTML() {
            const layoutDate = this.data.value && this.data.value.length ? this.data.value[0] : new Date().setHours(0, 0, 0, 0)
            const prevMonthHTML = this.monthHTML(layoutDate, `prev`)
            const currentMonthHTML = this.monthHTML(layoutDate)
            const nextMonthHTML = this.monthHTML(layoutDate, `next`)

            return [prevMonthHTML, currentMonthHTML, nextMonthHTML]
        },
        /**
         * 格式化日期
         */
        formatDate(date) {
            date = new Date(date)
            const year = date.getFullYear()
            const month = date.getMonth()
            const month1 = month + 1
            const day = date.getDate()
            const weekDay = date.getDay()

            return this.data.dateFormat
                .replace(/yyyy/g, year)
                .replace(/yy/g, (year + '').substring(2))
                .replace(/mm/g, month1 < 10 ? '0' + month1 : month1)
                .replace(/m/g, month1)
                .replace(/MM/g, this.data.monthNames[month])
                .replace(/M/g, this.data.monthNamesShort[month])
                .replace(/dd/g, day < 10 ? '0' + day : day)
                .replace(/d/g, day)
                .replace(/DD/g, this.data.dayNames[weekDay])
                .replace(/D/g, this.data.dayNamesShort[weekDay])
        },
        /**
         * 添加选中值
         */
        addValue(value) {
            if (this.data.multiple) {
                let arrValues = this.data.value || []
                let inValuesIndex = -1

                for (let i = 0; i < arrValues.length; i++) {
                    if (isSameDate(value, arrValues[i])) {
                        inValuesIndex = i
                    }
                }

                if (inValuesIndex === -1) {
                    arrValues.push(value)
                } else {
                    arrValues.splice(inValuesIndex, 1)
                }

                this.setValue(arrValues)
            } else {
                this.setValue([value])
            }
        },
        /**
         * 设置选择值
         */
        setValue(value) {
            // this.setData({ value }).then(() => this.updateValue())
            this.setData({ value }, () => {
                this.updateValue()
            })
        },
        /**
         * 更新日历
         */
        updateValue() {
            const changedPath = {}
            this.data.months.forEach((n, i) => {
                n.items.forEach((v, k) => {
                    v.forEach((p, j) => {
                        if (p.type.selected) {
                            changedPath[`months[${i}].items[${k}][${j}].type.selected`] = false
                        }
                    })
                })
            })

            // 设置选中值
            for (let ii = 0; ii < this.data.value.length; ii++) {
                const valueDate = new Date(this.data.value[ii])
                const valueYear = valueDate.getFullYear()
                const valueMonth = valueDate.getMonth()
                const valueDay = valueDate.getDate()

                this.data.months.forEach((n, i) => {
                    if (n.next || n.prev || n.year === valueYear && n.month === valueMonth) {
                        n.items.forEach((v, k) => {
                            v.forEach((p, j) => {
                                if (p.year === valueYear && p.month === valueMonth && p.day === valueDay) {
                                    changedPath[`months[${i}].items[${k}][${j}].type.selected`] = true
                                }
                            })
                        })
                    }
                })
            }
            changedPath.formatValue = this.data.value.map((n) => this.formatDate(n))
            changedPath.currentValues = this.data.value
            this.setData(changedPath)

            if (this.data.closeOnSelect && typeof this.fns.onChange === 'function') {
                this.fns.onChange.call(this, this.data.value, this.data.value.map((n) => this.formatDate(n)))
            }
        },
        noop() {}
    },
    created () {
        this.fns = {}
        wx.getSystemInfo({
            success: (res) => {
                // 仅有IOS提供滑动效果
                let isIos = res.system.indexOf('iOS') !== -1
                this.setData({
                    isIos
                })
            }
        })
    }
})
