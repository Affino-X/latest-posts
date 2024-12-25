let allPosts = [];


async function fetchPosts() {
    try {
        const response = await fetch('https://journal.zennolab.com/wp-json/wp/v2/posts?author=4&per_page=100');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const posts = await response.json();

        // Кэш для авторов и категорий
        const authorCache = new Map();
        const categoryCache = new Map();

        // Функция для получения данных автора
        const fetchAuthor = async (authorId) => {
            if (!authorCache.has(authorId)) {
                const authorResponse = await fetch(`https://journal.zennolab.com/wp-json/wp/v2/users/${authorId}`);
                const authorData = await authorResponse.json();
                authorCache.set(authorId, authorData);
            }
            return authorCache.get(authorId);
        };

        // Функция для получения данных категории
        const fetchCategory = async (categoryId) => {
            if (!categoryCache.has(categoryId)) {
                const categoryResponse = await fetch(`https://journal.zennolab.com/wp-json/wp/v2/categories/${categoryId}`);
                const categoryData = await categoryResponse.json();
                categoryCache.set(categoryId, { name: categoryData.name, link: categoryData.link });
            }
            return categoryCache.get(categoryId);
        };

        // Функция для получения изображения
        const fetchImage = async (mediaId) => {
            const imageResponse = await fetch(`https://journal.zennolab.com/wp-json/wp/v2/media/${mediaId}`);
            const imageData = await imageResponse.json();
            return imageData.source_url;
        };

        // Обработка всех постов
       allPosts = await Promise.all(posts.map(async (post) => {
            const [authorData, imageURL, categories] = await Promise.all([
                fetchAuthor(post.author),
                fetchImage(post.featured_media),
                Promise.all(post.categories.map(fetchCategory))
            ]);

            return {
                id: post.id,
                title: post.title.rendered,
                image: imageURL,
                description: post.content.rendered,
                date: post.date,
                link: post.link,
                categories,
                author: {
                    name: authorData.name,
                    avatar: authorData.penci_avatar?.['96'] || authorData.avatar_urls?.['96'],
                    link: authorData.link
                },
            };
        }));

       
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
}

const renderLatestPost = (post) => {
    const latestPostMain = document.getElementById("latestPostMain")

    latestPostMain.innerHTML = 
    (`
      <a>
        <img src="${post.image}" alt="Main Post Image" class="latest-post-main__image" />
      </a>
      <div class='shadow'></div>
      <h3 class="latest-post-main__title">
        <a>${post.title}</a>
      </h3>
     `
    )
}

const renderLatestPostWidget = (post) => {

    const latestPostWidget = document.getElementById("latestPostWidget")
    
    const latestPost = document.createElement('div')
    latestPost.classList.add('latest-post-widget__post')

    latestPostWidget.appendChild(latestPost)

    /* === CATEGORIES === */

    const categoriesBlock = document.createElement('div')
    categoriesBlock.classList.add('latest-post-widget__cateogries')
    latestPost.appendChild(categoriesBlock)


    post.categories.slice(0, 2).forEach((category) => {
        const categoryLink = document.createElement('a')
        categoryLink.classList.add('latest-post-widget__category-link')
        categoryLink.textContent = category.name
        categoryLink.href = category.link

        categoriesBlock.appendChild(categoryLink)
    })

    /* === TITLE === */
    const title = document.createElement('h3')
    title.classList.add('latest-post-widget__post-title')
    latestPost.appendChild(title)

    const titleLink = document.createElement('a')
    titleLink.textContent = post.title
    titleLink.href = post.link
    title.appendChild(titleLink)

    /* === AUTHOR AND DATE === */
    const span = document.createElement('span')
    latestPost.appendChild(span)

    const author = document.createElement('a')
    author.textContent = post.author.name
    author.href = post.author.link
    author.classList.add('latest-post-widget__post-author')

    const date = new Date(post.date);    

    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}.${date.getFullYear()}`;

    const dateElement = document.createElement('time')
    dateElement.textContent = formattedDate;
    
    
    span.appendChild(author)
    span.appendChild(dateElement)
} 



async function main() {
    await fetchPosts();

    // console.log(allPosts[0])
    renderLatestPost(allPosts[0])

    allPosts.slice(1, 5).forEach(post => {
        renderLatestPostWidget(post)
    });
    
}

main().catch((error) => console.error('Error loading posts:', error));
