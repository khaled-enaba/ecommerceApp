import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ReviewService } from '../../core/services/review.service';

@Component({
    selector: 'app-admin-reviews',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reviews.html',
    styleUrl: './reviews.css',
})
export class Reviews implements OnInit {
    private reviewService = inject(ReviewService);
    private cdr = inject(ChangeDetectorRef);
    private toastr = inject(ToastrService);

    reviews: any[] = [];
    isLoading = true;
    currentTab: 'pending' | 'all' = 'pending';

    ngOnInit() {
        this.loadReviews();
        this.cdr.detectChanges();
        
    }

    get filteredReviews() {
        if (this.currentTab === 'pending') {
            return this.reviews.filter(r => !r.isApproved);
        }
        return this.reviews;
    }

    get pendingCount() {
        return this.reviews.filter(r => !r.isApproved).length;
    }

    loadReviews() {
        this.isLoading = true;
        this.reviewService.getAllReviews().subscribe({
            next: (res: any) => {
                this.reviews = res.data || [];
                console.log('Reviews data:', this.reviews);
                console.log('First review:', this.reviews[0]);
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err: any) => {
                console.error('Error fetching reviews:', err);
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    setTab(tab: 'pending' | 'all') {
        this.currentTab = tab;
        this.cdr.markForCheck();
    }

    approveReview(id: string) {
        this.reviewService.approveReview(id).subscribe({
            next: () => {
                this.toastr.success('Message approved! It is now live on the homepage.');
                this.loadReviews();
            },
            error: (err: any) => {
                this.toastr.error(err.error?.message || 'Error approving review');
            }
        });
    }

    deleteReview(id: string) {
        this.reviewService.deleteReview(id).subscribe({
            next: () => {
                this.toastr.success('Message deleted from database.');
                this.loadReviews();
            },
            error: (err: any) => {
                this.toastr.error(err.error?.message || 'Error deleting review');
            }
        });
    }
}
