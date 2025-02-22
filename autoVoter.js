class AutoVoter {
    constructor(targetUrl) {
        this.targetUrl = targetUrl;
    }

    async fetchPage() {
        try {
            const response = await fetch(this.targetUrl);
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            const html = await response.text();
            return html;
        } catch (error) {
            console.log("请求页面出错:", error);
            return null;
        }
    }

    parseHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc;
    }

    getFormHash(doc) {
        const signoutElement = doc.querySelector('.u-signout.col_4 a');
        if (signoutElement) {
            const formhash = signoutElement.href.match(/formhash=(\w+)/)?.[1];
            return formhash;
        }
        console.log("Signout Element not found");
        return null;
    }

    getFidAndTid(doc) {
        const replyElement = doc.getElementById('post_reply');
        if (replyElement) {
            const onclick = replyElement.getAttribute('onclick');
            if (onclick) {
                const cleanedOnclick = onclick.replace(/\s+/g, ' ').trim();
                const fidMatch = cleanedOnclick.match(/fid=(\d+)/);
                const tidMatch = cleanedOnclick.match(/tid=(\d+)/);
                const fid = fidMatch ? fidMatch[1] : null;
                const tid = tidMatch ? tidMatch[1] : null;
                return { fid, tid };
            } else {
                console.log("Reply Element has no onclick attribute");
                return { fid: null, tid: null };
            }
        } else {
            console.log("Reply Element not found");
            return { fid: null, tid: null };
        }
    }

    getPollAnswers(doc) {
        const options = doc.querySelectorAll('input[name="pollanswers[]"]');
        const answers = [];
        options.forEach(option => {
            answers.push(option.value);
        });
        return answers;
    }

    async vote() {
        let fetchedHtml = await this.fetchPage();
        let parsedHtml = this.parseHTML(fetchedHtml);
        let formhash = this.getFormHash(parsedHtml);
        console.log("Formhash:", formhash);
        let { fid, tid } = this.getFidAndTid(parsedHtml);
        console.log("fid:", fid);
        console.log("tid:", tid);
        let pollAnswers = this.getPollAnswers(parsedHtml);
        console.log("pollAnswers:", pollAnswers);
        const pollAnswer = pollAnswers[pollAnswers.length - 1];
        if (!formhash || !fid || !tid || !pollAnswer) {
            console.log("无法获取必要的投票信息");
            return;
        }
        const url = `https://www.gamemale.com/forum.php?mod=misc&action=votepoll&fid=${fid}&tid=${tid}&pollsubmit=yes&quickforward=yes&inajax=1`;
        const data = new URLSearchParams();
        data.append('formhash', formhash);
        data.append('pollanswers[]', pollAnswer);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data.toString(),
            });
            if (response.ok) {
                console.log("投票成功！", response.text);
            } else {
                console.log("投票失败，请求未成功", response.text);
            }
        } catch (error) {
            console.log("投票请求出错:", error);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoVoter;
}
