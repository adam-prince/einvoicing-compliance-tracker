import React, { Component, ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return {
			hasError: true,
			error
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Error caught by ErrorBoundary:', error, errorInfo);
		
		this.setState({
			error,
			errorInfo
		});

		// Log to external service in production
		if (process.env.NODE_ENV === 'production') {
			// Example: reportError(error, errorInfo);
		}
	}

	handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null
		});
	};

	handleReload = () => {
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="error-boundary" role="alert" aria-live="assertive">
					<div className="error-container">
						<div className="error-header">
							<h2>Something went wrong</h2>
							<p>We're sorry, but something unexpected happened.</p>
						</div>

						<div className="error-details">
							<details>
								<summary>Error Details</summary>
								<div className="error-stack">
									<h4>Error Message:</h4>
									<pre>{this.state.error?.message}</pre>
									
									{this.state.error?.stack && (
										<>
											<h4>Stack Trace:</h4>
											<pre>{this.state.error.stack}</pre>
										</>
									)}
									
									{this.state.errorInfo?.componentStack && (
										<>
											<h4>Component Stack:</h4>
											<pre>{this.state.errorInfo.componentStack}</pre>
										</>
									)}
								</div>
							</details>
						</div>

						<div className="error-actions">
							<button 
								onClick={this.handleRetry}
								className="retry-button"
								aria-label="Try to recover from error"
							>
								Try Again
							</button>
							<button 
								onClick={this.handleReload}
								className="reload-button"
								aria-label="Reload the page"
							>
								Reload Page
							</button>
						</div>

						<div className="error-help">
							<p>
								If this problem persists, please contact support with the error details above.
							</p>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Functional component version for simple error states
interface ErrorMessageProps {
	message: string;
	onRetry?: () => void;
	onReload?: () => void;
}

export function ErrorMessage({ message, onRetry, onReload }: ErrorMessageProps) {
	return (
		<div className="error-message" role="alert" aria-live="assertive">
			<div className="error-container">
				<div className="error-header">
					<h3>Error</h3>
					<p>{message}</p>
				</div>
				
				<div className="error-actions">
					{onRetry && (
						<button 
							onClick={onRetry}
							className="retry-button"
							aria-label="Retry the failed operation"
						>
							Retry
						</button>
					)}
					{onReload && (
						<button 
							onClick={onReload}
							className="reload-button"
							aria-label="Reload the page"
						>
							Reload
						</button>
					)}
				</div>
			</div>
		</div>
	);
}