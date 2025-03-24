import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NasaPost } from './interfaces/posts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private url = 'https://api.nasa.gov/planetary/apod';

  private startDate = signal(
    new Date(new Date().setDate(new Date().getDate() - 2))
  );
  private endDate = signal(new Date());

  private apiUrl = computed(() => {
    const url = new URL(this.url);
    url.searchParams.set('api_key', '7YNegdR24CyQ7l3B8zRg9IkaLEgC7pQdVehXcdc9');
    url.searchParams.set(
      'start_date',
      this.startDate().toISOString().split('T')[0]
    );
    url.searchParams.set(
      'end_date',
      this.endDate().toISOString().split('T')[0]
    );

    return url.toString();
  });

  concatPosts = signal<NasaPost[]>([]);
  expandedPosts = signal<Set<string>>(new Set());

  nasaPostsHttp = httpResource<NasaPost[]>(() => this.apiUrl(), {
    parse: (response: any) => {
      this.concatPosts.update((posts) => [...posts, ...response]);
      return response;
    },
  });

  filterPosts = computed(() => {
    return this.concatPosts()
      .filter((post) => post.url && post.url.trim() !== '')
      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  });

  onScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      // Set endDate to one day before current startDate
      const newEndDate = new Date(this.startDate());
      newEndDate.setDate(newEndDate.getDate() - 1);
      this.endDate.set(newEndDate);

      // Set startDate to 3 days before the new endDate
      const newStartDate = new Date(newEndDate);
      newStartDate.setDate(newStartDate.getDate() - 2);
      this.startDate.set(newStartDate);

      // Fetch more posts
      this.nasaPostsHttp.reload();
    }
  }

  // Toggle post expansion
  toggleExpand(title: string): void {
    this.expandedPosts.update((posts) => {
      const newPosts = new Set(posts);
      if (newPosts.has(title)) {
        newPosts.delete(title);
      } else {
        newPosts.add(title);
      }
      return newPosts;
    });
  }

  // Check if a post is expanded
  isExpanded(title: string): boolean {
    return this.expandedPosts().has(title);
  }
}
