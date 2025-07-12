# Renwu - a task manager

## Why I started the project

有了AI，这是编程者最好的时代。

我们有很多产品想法，我们有很多软件架构设计思路，我们有很多想尝试的新技术。在从前，没有AI，可能这些想法止步于`npm install`之后碰到的第一个技术问题。有了AI，快速落地代码实现非常快速，我们更可以专注于产品设计、软件架构和新技术尝试。 

所以，就我自己目前而言，同时进行多个个人项目已经成为常态。这就需要记录和管理更多的产品需求、想法和任务，但是纵览市面上的task management应用，大多数有个问题：太重了！ 

有的应用UI之复杂，从我打开应用到我能创建一个task，已经过去几分钟。他们设计目标是all for one，想尽可能覆盖更多类型用户。有的应用界面更简洁，但打开一个task页面，task的description居然还要再点击一次，然后经历几秒中的加载（当然和网速有关），UI再经过变换，才能进入编辑状态。难道打开一个task，通常最主要的任务不就是去查看/编辑描述吗？你就放一个textarea让我能快速倒出我们想法不就可以了吗？ 

我需要一个像打开ios备忘录一样快速ready，能让我开始写需求和想法的app。

With the rise of AI, this is the best era for developers.   

We have countless product ideas, software architecture designs, and new technologies we want to explore. In the past, without AI many of these ideas might have stalled right after `npm install`, blocked by the first technical hurdle.Now, AI enables us to implement ideas rapidly, allowing us to focus more on product design, architecture, and experimentation.    

Personally, working on multiple side projects in parallel has become the norm.But this also means I need to keep track of more ideas, feature requirements, and development tasks.
Most task management tools on the market today are just too heavy!   

Some are packed with overly complex UIs — it takes me several minutes just to create a new task. These tools try to be “all-in-one,” aiming to fit every type of user.  

Some apps do offer a cleaner interface, but even then — opening a task still feels unnecessarily slow.You have to click again just to reveal the task description, wait a few seconds for it to load (depending on your network), and then watch the UI shift before you're finally allowed to edit. 

But come on — isn’t the main reason we open a task simply to view or edit its description?
Why not just show me a textarea right away — like opening the iOS Notes app — and let me pour out my ideas instantly?   

## Technology Stack

- React
- Vite
- TypeScript
- Express (backend API)
- Node.js (backend runtime)
- Docker
- Shadcn ui
- Drizzle with Postgres

## Project Structure

- `client/` – Frontend React app (pages, components, routing, UI kit)
- `server/` – Backend API (Express, TypeScript)
- `common/` – Shared types and utilities

See the `client/README.md` and `server/README.md` for detailed usage and development instructions.

---

This project is created from the react full stack starter.